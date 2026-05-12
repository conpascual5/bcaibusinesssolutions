import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { env } from "./lib/env.js";
import salesWizard from "./sales-wizard.js";
import loginApp from "./login.js";
import registerApp from "./register.js";

const app = new Hono();

// Mount standalone login and register endpoints FIRST — minimal imports, fast cold start
app.route("/", loginApp);
app.route("/", registerApp);

// Mount sales wizard routes
app.route("/", salesWizard);

// Mount FB Ads Targeting routes
import fbAdsTargeting from "./fb-ads-targeting.js";
app.route("/", fbAdsTargeting);

// Mount Image Ad Analyzer routes
import imageAdAnalyzer from "./image-ad-analyzer.js";
app.route("/", imageAdAnalyzer);

// Mount Usage tracking routes
import usageApp from "./usage.js";
app.route("/", usageApp);

// Global error handler — ensures all errors return JSON
app.onError((err, c) => {
  console.error("[Hono error]", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

// Competitor Ad Copy Analyzer endpoint using Deepseek
app.post("/api/analyze-copy", async (c) => {
  try {
    const { text, type } = await c.req.json();
    if (!text) return c.json({ error: "No text provided" }, 400);

    // Try env var first, then fall back to Supabase settings
    let apiKey = env.deepseekApiKey;
    if (!apiKey) {
      try {
        const { getSupabaseClient } = await import("./queries/supabase-client");
        const supabase = getSupabaseClient();
        const { data } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "deepseek_api_key")
          .single();
        apiKey = data?.value ?? "";
      } catch {
        // DB lookup failed
      }
    }
    if (!apiKey) {
      return c.json({ error: "Deepseek API key not configured. Ask an admin to set it in Settings." }, 500);
    }

    const prompt = `You are an expert advertising analyst and copywriter. Analyze the following ${type === 'url' ? 'landing page content' : 'ad copy'} and provide:

1. **Psychological Triggers Analysis**: For each of these triggers - Scarcity, Social Proof, Problem-Agitation-Solution, Urgency, Authority, Reciprocity - determine if it's being used and cite specific evidence from the text.

2. **Counter-Positioning Strategies**: Suggest 3 ways to counter-position or improve this copy. For each strategy, provide:
   - A compelling title
   - The strategic approach
   - A concrete example of counter-copy

3. **Summary**: A brief 2-3 sentence analysis of the overall persuasion strategy.

Format your response as valid JSON with this exact structure:
{
  "psychologicalTriggers": [
    { "name": "Scarcity", "description": "...", "found": true/false, "evidence": "..." }
  ],
  "counterPositioning": [
    { "title": "...", "strategy": "...", "example": "..." }
  ],
  "summary": "..."
}

TEXT TO ANALYZE:
${text}`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a precise JSON generator. Always respond with valid JSON only, no markdown formatting." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Deepseek API error:", response.status, errText);
      return c.json({ error: `Deepseek API error: ${response.status}` }, 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return c.json({ error: "No response from AI" }, 500);
    }

    // Parse the JSON from the response
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return c.json(parsed);
  } catch (err: any) {
    console.error("Analyze copy error:", err);
    return c.json({ error: err.message || "Analysis failed" }, 500);
  }
});

// Health check endpoint
app.get("/api/health", async (c) => {
  try {
    const { getSupabaseClient } = await import("./queries/supabase-client");
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return c.json({
      status: error ? "degraded" : "ok",
      time: Date.now(),
      db: error ? "error" : "connected",
    });
  } catch {
    return c.json({ status: "starting", time: Date.now(), db: "initializing" });
  }
});

// Debug endpoint: test fal.ai API connectivity
app.get("/api/fal-debug", async (c) => {
  const apiKey = c.req.query("apiKey");
  if (!apiKey) return c.json({ error: "Missing apiKey query param" }, 400);

  const { testFalEndpoints } = await import("./fal-debug");
  const results = await testFalEndpoints(apiKey);
  return c.json({ results });
});

// Image upload/samples endpoints
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

app.post("/api/upload", bodyLimit({ maxSize: 50 * 1024 * 1024 }), async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return c.json({ error: "No file provided" }, 400);

    const ext = extname(file.name) || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const samplesDir = join(process.cwd(), "public", "samples");

    await mkdir(samplesDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(samplesDir, filename), buffer);

    return c.json({ success: true, url: `/samples/${filename}` });
  } catch (err: any) {
    console.error("Upload failed:", err);
    return c.json({ error: err.message }, 500);
  }
});

// List uploaded sample images
let samplesCache: { images: { url: string; name: string }[]; ts: number } | null = null;
const SAMPLES_CACHE_TTL = 30_000;

app.get("/api/samples", async (c) => {
  // On Vercel (serverless) we don't persist uploaded files.
  // Return immediately to avoid unnecessary work and timeouts.
  if (env.isVercel) {
    return c.json({ images: [] });
  }

  try {
    const now = Date.now();
    if (samplesCache && (now - samplesCache.ts) < SAMPLES_CACHE_TTL) {
      return c.json({ images: samplesCache.images });
    }
    const { readdir } = await import("fs/promises");
    const samplesDir = join(process.cwd(), "public", "samples");
    const files = await readdir(samplesDir).catch(() => []);
    const images = files
      .filter((f) => /\\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map((f) => ({ url: `/samples/${f}`, name: f }));
    samplesCache = { images, ts: now };
    return c.json({ images });
  } catch {
    return c.json({ images: [] });
  }
});

// Delete a sample image
app.delete("/api/samples/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");
    const { unlink } = await import("fs/promises");
    const filePath = join(process.cwd(), "public", "samples", filename);
    await unlink(filePath);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// tRPC handler with improved error handling
app.use("/api/trpc/*", async (c) => {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("tRPC request timed out after 60 seconds")), 60000)
    );

    const result = await Promise.race([
      fetchRequestHandler({
        endpoint: "/api/trpc",
        req: c.req.raw,
        router: appRouter,
        createContext,
        onError({ error, path }) {
          console.error("[tRPC handler]", path, error?.message);
        },
      }),
      timeoutPromise,
    ]);

    return result;
  } catch (err: any) {
    console.error("[tRPC handler error]", err?.message ?? err);
    return c.json({
      error: err?.message || "Internal server error",
      code: "INTERNAL_SERVER_ERROR"
    }, 500);
  }
});

// Promote user to admin via Supabase
app.post("/api/promote-admin", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: "Email required" }, 400);
    const { getSupabaseClient } = await import("./queries/supabase-client");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("email", email)
      .select("id")
      .single();

    if (error || !data) return c.json({ error: "User not found" }, 404);
    return c.json({ success: true, message: `User ${email} is now an admin` });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Reactivate admin endpoint
app.post("/api/reactivate-admin", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: "Email required" }, 400);
    const { getSupabaseClient } = await import("./queries/supabase-client");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_active: true })
      .eq("email", email)
      .select("id")
      .single();

    if (error || !data) return c.json({ error: "User not found" }, 404);
    return c.json({ success: true, message: "Admin account reactivated" });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
