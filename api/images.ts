import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { generatedImages, searches, settings } from "@db/schema";
import { eq, desc, lt, and } from "drizzle-orm";

const FAL_KEY = "fal_api_key";
const BASE = "https://queue.fal.run";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function validateBeforeFal(apiKey: string, productImageUrl: string): string | null {
  if (!apiKey || apiKey.length < 20) return "Invalid API key.";
  if (!productImageUrl.startsWith("data:image/") && !productImageUrl.startsWith("http")) {
    return "Invalid image. Must be base64 or http URL.";
  }
  return null;
}

/**
 * Try to get result from fal.ai using multiple URL patterns.
 * Returns the result from the first successful pattern.
 */
async function tryGetResult(apiKey: string, requestId: string): Promise<{
  ok: boolean;
  url?: string;
  error?: string;
}> {
  const patterns = [
    `/fal-ai/nano-banana-2/edit/requests/${requestId}`,
    `/fal-ai/nano-banana-2/requests/${requestId}`,
  ];

  // Try all patterns in parallel
  const attempts = await Promise.all(
    patterns.map(async (path) => {
      try {
        const res = await fetch(`${BASE}${path}`, {
          headers: { Authorization: `Key ${apiKey}` },
        });
        const text = await res.text();
        return { path, status: res.status, text };
      } catch (e: any) {
        return { path, status: 0, error: e.message };
      }
    })
  );

  console.log("[fal-try] Attempts:", attempts.map((a) => `${a.path}=${a.status}`).join(", "));

  // Use first successful (status 200) response
  for (const a of attempts) {
    if (a.status === 200 && a.text) {
      try {
        const data = JSON.parse(a.text);
        const url = data.images?.[0]?.url ?? data.image?.url ?? data.url ?? null;
        if (url) return { ok: true, url };
      } catch { /* ignore */ }
    }
  }

  // Check for 202 (still processing)
  const has202 = attempts.some((a) => a.status === 202);
  if (has202) return { ok: false };

  // All failed
  const errors = attempts.map((a) => `${a.path.replace("/fal-ai/nano-banana-2", "")}=${a.status}`).join("; ");
  return { ok: false, error: `All patterns failed: ${errors}` };
}

/**
 * Submit and poll using the pattern that works.
 */
async function submitAndPoll(
  apiKey: string,
  prompt: string,
  imageUrl: string,
  aspectRatio: string
): Promise<string | null> {
  // Submit
  const submitRes = await fetch(`${BASE}/fal-ai/nano-banana-2/edit`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_url: imageUrl,
      aspect_ratio: aspectRatio,
      num_images: 1,
      output_format: "png",
    }),
  });

  const submitText = await submitRes.text();
  console.log(`[fal] Submit HTTP ${submitRes.status}: ${submitText.substring(0, 200)}`);

  if (!submitRes.ok) {
    throw new Error(`Submit failed: ${submitRes.status} - ${submitText.substring(0, 200)}`);
  }

  const submitData = JSON.parse(submitText);
  const requestId = submitData.request_id ?? submitData.id ?? null;
  if (!requestId) throw new Error("No request_id in submit response");
  console.log(`[fal] requestId: ${requestId}`);

  // Poll
  for (let attempt = 0; attempt < 90; attempt++) {
    const result = await tryGetResult(apiKey, requestId);

    if (result.ok && result.url) {
      console.log(`[fal] SUCCESS after ${attempt} attempts`);
      return result.url;
    }

    if (result.error) {
      console.log(`[fal] Attempt ${attempt}: ${result.error}`);
    }

    await sleep(2000);
  }

  throw new Error("Timed out after 90 attempts (3 minutes)");
}

async function generateOneImage(
  apiKey: string,
  productImageUrl: string,
  productName: string,
  themeTitle: string,
  themeDescription: string,
  userId: number,
  aspectRatio: string
) {
  const validationError = validateBeforeFal(apiKey, productImageUrl);
  if (validationError) {
    return { id: 0, url: null, status: "failed" as const, error: validationError };
  }

  const db = getDb();
  const prompt = `Professional commercial advertisement photograph of ${productName}. ${themeDescription}. High-end studio lighting, clean composition, product-focused.`;

  let insertedId: number;
  try {
    const [inserted] = await db.insert(generatedImages).values({
      userId,
      productImageUrl: productImageUrl.substring(0, 200),
      themeTitle,
      prompt,
      status: "pending",
    }).$returningId();
    insertedId = inserted.id;
  } catch (dbErr: any) {
    return { id: 0, url: null, status: "failed" as const, error: `DB error: ${dbErr.message}` };
  }

  try {
    const resultUrl = await submitAndPoll(apiKey, prompt, productImageUrl, aspectRatio);

    await db.update(generatedImages)
      .set({ resultImageUrl: resultUrl, status: "completed" })
      .where(eq(generatedImages.id, insertedId));

    return { id: insertedId, url: resultUrl, status: "completed" as const, error: null };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[fal] Error:`, msg);
    try {
      await db.update(generatedImages)
        .set({ status: "failed" })
        .where(eq(generatedImages.id, insertedId));
    } catch { /* ignore */ }
    return { id: insertedId, url: null, status: "failed" as const, error: msg };
  }
}

export const imageRouter = createRouter({
  generate: authedQuery
    .input(
      z.object({
        productImageUrl: z.string().min(1),
        themeTitle: z.string().min(1),
        themeDescription: z.string().min(1),
        productName: z.string().min(1),
        count: z.number().int().min(1).max(10),
        imageSize: z.enum(["1:1", "9:16", "16:9"]).default("1:1"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log(`[generate] START user ${ctx.user.userId}: ${input.productName} x${input.count}`);
      const db = getDb();

      const [keyRow] = await db.select().from(settings).where(eq(settings.key, FAL_KEY)).limit(1);
      const apiKey = keyRow?.value ?? null;
      if (!apiKey) throw new TRPCError({ code: "BAD_REQUEST", message: "Fal.ai API key not configured." });

      const preCheck = validateBeforeFal(apiKey, input.productImageUrl);
      if (preCheck) throw new TRPCError({ code: "BAD_REQUEST", message: preCheck });

      const results: Array<{ id: number; url: string | null; status: string; error: string | null }> = [];
      for (let i = 0; i < input.count; i++) {
        const result = await generateOneImage(
          apiKey, input.productImageUrl, input.productName,
          input.themeTitle, input.themeDescription, ctx.user.userId, input.imageSize
        );
        results.push(result);
      }

      const successImages = results.filter((r) => r.url);
      const failedCount = results.length - successImages.length;

      if (successImages.length === 0) {
        const errors = results.map((r, i) => `Img${i + 1}: ${r.error ?? "unknown"}`).join("; ");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `All failed: ${errors}` });
      }

      return {
        images: successImages.map((r) => ({ id: r.id, url: r.url! })),
        failed: failedCount,
        errors: results.filter((r) => r.error).map((r) => r.error!),
      };
    }),

  saveOverlay: authedQuery
    .input(z.object({
      imageId: z.number(),
      overlayText: z.string().optional(),
      overlaySettings: z.any().optional(),
      finalImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [img] = await db.select().from(generatedImages)
        .where(and(eq(generatedImages.id, input.imageId), eq(generatedImages.userId, ctx.user.userId)))
        .limit(1);
      if (!img) throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });

      await db.update(generatedImages)
        .set({
          overlayText: input.overlayText ?? null,
          overlaySettings: input.overlaySettings ?? null,
          finalImageUrl: input.finalImageUrl ?? null,
        })
        .where(eq(generatedImages.id, input.imageId));

      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(generatedImages)
        .where(and(eq(generatedImages.id, input.id), eq(generatedImages.userId, ctx.user.userId)));
      return { success: true };
    }),

  listMyImages: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.userId, ctx.user.userId))
      .orderBy(desc(generatedImages.createdAt))
      .limit(100);
  }),

  cleanup: adminQuery.mutation(async () => {
    const db = getDb();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await db.delete(generatedImages).where(lt(generatedImages.createdAt, thirtyDaysAgo));
    await db.delete(searches).where(lt(searches.createdAt, thirtyDaysAgo));
    return { success: true, deletedBefore: thirtyDaysAgo.toISOString() };
  }),
});
   