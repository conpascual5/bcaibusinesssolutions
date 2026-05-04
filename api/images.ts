import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware.js";
import { getDbReady } from "./queries/connection.js";
import { images, settings } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { env } from "./lib/env.js";

async function getFalKey(): Promise<string> {
  const db = await getDbReady() as any;
  const [row] = await db.select().from(settings).where(eq(settings.key, "fal_api_key")).limit(1);
  return row?.value ?? env.falApiKey ?? "";
}

export const imageRouter = createRouter({
  generate: authedQuery
    .input(
      z.object({
        prompt: z.string().min(1).max(1000),
        imageSize: z.enum(["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"]).default("square_hd"),
        numImages: z.number().min(1).max(4).default(1),
        style: z.enum(["auto", "cinematic", "digital-art", "photographic", "anime", "fantasy-art", "comic-book", "low-poly", "line-art", "pixel-art", "3d-model", "watercolor", "isometric", "craft-clay", "origami", "modeling-compound"]).default("auto"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const apiKey = await getFalKey();
      if (!apiKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "FAL_API_KEY not configured. Ask an admin to set it in Settings." });
      }

      const response = await fetch("https://fal.run/fal-ai/flux-pro/v1.1-ultra", {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input.prompt,
          image_size: input.imageSize,
          num_images: input.numImages,
          style: input.style === "auto" ? undefined : input.style,
          enable_safety_checker: false,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("fal.ai error:", response.status, errBody);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Image generation failed: ${errBody}` });
      }

      const data: any = await response.json();

      // Save images to DB
      const db = await getDbReady() as any;
      const savedImages: any[] = [];
      if (data.images) {
        for (const img of data.images) {
          const imgResult = await db.insert(images).values({
            userId: ctx.user.userId,
            url: img.url,
            prompt: input.prompt,
            width: img.width ?? 0,
            height: img.height ?? 0,
            contentType: img.content_type ?? "image/jpeg",
          }).returning({ id: images.id });
          const saved = imgResult[0];
          savedImages.push({ id: saved.id, url: img.url, width: img.width, height: img.height, contentType: img.content_type });
        }
      }

      return {
        seed: data.seed ?? null,
        images: savedImages,
        prompt: input.prompt,
      };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = await getDbReady() as any;
    return db
      .select()
      .from(images)
      .where(eq(images.userId, ctx.user.userId))
      .orderBy(desc(images.createdAt))
      .limit(100);
  }),

  delete: authedQuery
    .input(z.object({ imageId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDbReady() as any;
      const [img] = await db.select().from(images).where(eq(images.id, input.imageId)).limit(1);
      if (!img) throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
      if (img.userId !== ctx.user.userId && !ctx.user.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your image" });
      }
      await db.delete(images).where(eq(images.id, input.imageId));
      return { success: true };
    }),
});

