import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { env } from "./lib/env.js";

const app = new Hono();

// Competitor Ad Copy Analyzer endpoint using Deepseek
app.post("/api/analyze-copy", async (c) => {
  try {
    const { text, type } = await c.req.json();
    if (!text) return c.json({ error: "No text provided" }, 400);

    const apiKey = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return c.json({ error: "Deepseek API key not configured. Please set DEEPSEEK_API_KEY in your .env file." }, 500);
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

// Health check endpoint - lets frontend verify API is reachable
import { testDbConnection } from "./queries/connection.js";
app.get("/api/health", async (c) => {
  const dbOk = await testDbConnection();
  return c.json({
    status: dbOk ? "ok" : "db_unavailable",
    time: Date.now(),
    db: dbOk ? "connected" : "disconnected",
  });
});

// Debug endpoint: test fal.ai API connectivity
// GET /api/fal-debug?apiKey=YOUR_FAL_KEY
app.get("/api/fal-debug", async (c) => {
  const apiKey = c.req.query("apiKey");
  if (!apiKey) return c.json({ error: "Missing apiKey query param" }, 400);

  const { testFalEndpoints } = await import("./fal-debug.js");
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
app.get("/api/samples", async (c) => {
  try {
    const { readdir } = await import("fs/promises");
    const samplesDir = join(process.cwd(), "public", "samples");
    const files = await readdir(samplesDir).catch(() => []);
    const images = files
      .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map((f) => ({ url: `/samples/${f}`, name: f }));
    return c.json({ images });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
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

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// Setup endpoint - creates database tables directly
app.post("/api/setup", async (c) => {
  try {
    const { getDb } = await import("./queries/connection.js");
    const db = getDb();

    await db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_query TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      prompt TEXT NOT NULL,
      width INTEGER NOT NULL DEFAULT 0,
      height INTEGER NOT NULL DEFAULT 0,
      content_type TEXT NOT NULL DEFAULT 'image/jpeg',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT 'New Chat',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS generated_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_image_url TEXT NOT NULL,
      theme_title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      result_image_url TEXT,
      overlay_text TEXT,
      overlay_settings TEXT,
      final_image_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      message TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);

    return c.json({ success: true, message: "Database tables created successfully" });
  } catch (err) {
    console.error("Setup failed:", err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

// Setup-tables endpoint - creates tables directly via DB connection
app.post("/api/setup-tables", async (c) => {
  try {
    const { getDb } = await import("./queries/connection.js");
    const db = getDb();

    // Create tables using raw SQL (SQLite syntax)
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_query TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        prompt TEXT NOT NULL,
        width INTEGER NOT NULL DEFAULT 0,
        height INTEGER NOT NULL DEFAULT 0,
        content_type TEXT NOT NULL DEFAULT 'image/jpeg',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT 'New Chat',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS generated_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_image_url TEXT NOT NULL,
        theme_title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        result_image_url TEXT,
        overlay_text TEXT,
        overlay_settings TEXT,
        final_image_url TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        message TEXT NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    return c.json({ success: true, message: "All tables created successfully" });
  } catch (err) {
    console.error("Setup tables failed:", err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

// Seed endpoint - creates the admin user (uses child_process, won't work on Vercel)
app.post("/api/seed", async (c) => {
  if (env.isVercel) {
    return c.json({ success: false, error: "Use the /setup page to create admin via tRPC on Vercel" }, 400);
  }
  try {
    const { execSync } = await import("child_process");
    const { resolve } = await import("path");
    const root = resolve(process.cwd());

    console.log("Running seed script...");
    execSync("npx tsx db/seed.ts", { cwd: root, stdio: "inherit", timeout: 30000 });
    console.log("Database seeded successfully!");

    return c.json({ success: true, message: "Admin user created (conpascual5@gmail.com / admin123)" });
  } catch (err) {
    console.error("Seed failed:", err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

// Only start the Node server when NOT on Vercel
if (env.isProduction && !env.isVercel) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite.js");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
