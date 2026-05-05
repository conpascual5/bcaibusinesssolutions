import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { env } from "./lib/env.js";
import salesWizard from "./sales-wizard.js";

const app = new Hono();

// Warm up the database connection on boot so first request doesn't timeout
// This starts SQL.js WASM loading + table creation in the background
// Always run this — even without DATABASE_URL (SQLite mode)
import("./queries/connection.js").then(({ waitForDb }) => {
  waitForDb().then(() => {
    console.log("[DB] Database warmed up successfully on boot");
  }).catch((err) => {
    console.error("[DB] Database warm-up failed (will retry on first request):", err?.message ?? err);
  });
});

// Mount sales wizard routes
app.route("/", salesWizard);

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

    // Try env var first, then fall back to database setting
    let apiKey = env.deepseekApiKey;
    if (!apiKey) {
      try {
        const { getDbReady } = await import("./queries/connection.js");
        const { settings } = await import("../db/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDbReady();
        const [row] = await db.select().from(settings).where(eq(settings.key, "deepseek_api_key")).limit(1);
        apiKey = row?.value ?? "";
      } catch {
        // DB lookup failed, apiKey stays empty
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

// Auto-init endpoint — creates tables and seeds admin directly (no shell commands)
// Visit /api/init-db once to set up the database
app.get("/api/init-db", async (c) => {
  try {
    const results: string[] = [];
    const { env } = await import("./lib/env.js");

    if (!env.databaseUrl) {
      return c.json({ success: false, error: "DATABASE_URL not configured" }, 400);
    }

    const isNeon = env.databaseUrl.startsWith("postgres://") || env.databaseUrl.startsWith("postgresql://");

    if (isNeon) {
      results.push("Using Neon/Postgres database...");
      const { neon } = await import("@neondatabase/serverless");
      const sqlNeon = neon(env.databaseUrl);

      // Create all tables in a single batch
      await sqlNeon`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL, name VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true, is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS searches (
        id SERIAL PRIMARY KEY, user_id INTEGER,
        product_query VARCHAR(500) NOT NULL, ip_address VARCHAR(100),
        user_agent TEXT, created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY, key VARCHAR(100) NOT NULL UNIQUE,
        value TEXT NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
        url TEXT NOT NULL, prompt TEXT NOT NULL,
        width INTEGER NOT NULL DEFAULT 0, height INTEGER NOT NULL DEFAULT 0,
        content_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
        title VARCHAR(200) NOT NULL DEFAULT 'New Chat',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY, chat_id INTEGER NOT NULL,
        role VARCHAR(20) NOT NULL, content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS generated_images (
        id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
        product_image_url TEXT NOT NULL, theme_title VARCHAR(200) NOT NULL,
        prompt TEXT NOT NULL, result_image_url TEXT, overlay_text VARCHAR(500),
        overlay_settings TEXT, final_image_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
        user_name VARCHAR(100) NOT NULL, user_email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL, is_admin BOOLEAN NOT NULL DEFAULT false,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`;
      results.push("✅ All tables created");

      // Seed admin user
      const bcrypt = await import("bcryptjs");
      const hash = bcrypt.hashSync("admin123", 10);
      await sqlNeon`INSERT INTO users (email, password_hash, name, is_active, is_admin)
         VALUES ('conpascual5@gmail.com', ${hash}, 'BC AI Admin', true, true)
         ON CONFLICT (email) DO NOTHING`;
      results.push("✅ Admin user seeded (conpascual5@gmail.com / admin123)");
    } else {
      // Local SQLite
      results.push("Using SQLite database...");
      const initSqlJs = (await import("sql.js")).default;
      const path = await import("path");
      const fs = await import("fs");

      const dbDir = path.resolve(process.cwd(), "data");
      const dbPath = path.resolve(dbDir, "app.db");
      fs.mkdirSync(dbDir, { recursive: true });

      let buffer = null;
      try { buffer = fs.readFileSync(dbPath); } catch {}

      const SQL = await initSqlJs();
      const sqlJsDb = new SQL.Database(buffer);

      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL, name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1, is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER,
        product_query TEXT NOT NULL, ip_address TEXT, user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
        url TEXT NOT NULL, prompt TEXT NOT NULL, width INTEGER NOT NULL DEFAULT 0,
        height INTEGER NOT NULL DEFAULT 0, content_type TEXT NOT NULL DEFAULT 'image/jpeg',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT 'New Chat',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL,
        role TEXT NOT NULL, content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS generated_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
        product_image_url TEXT NOT NULL, theme_title TEXT NOT NULL,
        prompt TEXT NOT NULL, result_image_url TEXT, overlay_text TEXT,
        overlay_settings TEXT, final_image_url TEXT, status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL, user_email TEXT NOT NULL, message TEXT NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0, is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      results.push("✅ All tables created");

      // Seed admin
      const bcrypt = await import("bcryptjs");
      const hash = bcrypt.hashSync("admin123", 10);
      sqlJsDb.run(
        `INSERT OR IGNORE INTO users (email, password_hash, name, is_active, is_admin)
         VALUES ('conpascual5@gmail.com', ?, 'BC AI Admin', 1, 1)`,
        [hash]
      );
      results.push("✅ Admin user seeded (conpascual5@gmail.com / admin123)");

      const data = sqlJsDb.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
      sqlJsDb.close();
    }

    return c.json({ success: true, results });
  } catch (err: any) {
    console.error("Init DB failed:", err);
    return c.json({ success: false, error: err.message, stack: err.stack }, 500);
  }
});

// Health check endpoint - lets frontend verify API is reachable
// Quick health check — responds immediately without waiting for DB
// The client uses this to verify the server is reachable before attempting login
app.get("/api/health", async (c) => {
  try {
    const { testDbConnection } = await import("./queries/connection.js");
    // Use a short timeout so we don't block the response
    const dbOk = await Promise.race([
      testDbConnection(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)),
    ]);
    return c.json({
      status: dbOk ? "ok" : "starting",
      time: Date.now(),
      db: dbOk ? "connected" : "initializing",
    });
  } catch {
    return c.json({ status: "starting", time: Date.now(), db: "initializing" });
  }
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

// List uploaded sample images (cached for 30s to avoid repeated filesystem reads)
let samplesCache: { images: { url: string; name: string }[]; ts: number } | null = null;
const SAMPLES_CACHE_TTL = 30_000;

app.get("/api/samples", async (c) => {
  try {
    const now = Date.now();
    if (samplesCache && (now - samplesCache.ts) < SAMPLES_CACHE_TTL) {
      return c.json({ images: samplesCache.images });
    }
    const { readdir } = await import("fs/promises");
    const samplesDir = join(process.cwd(), "public", "samples");
    const files = await readdir(samplesDir).catch(() => []);
    const images = files
      .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
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

app.use("/api/trpc/*", async (c) => {
  try {
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext,
    });
  } catch (err: any) {
    console.error("[tRPC handler error]", err);
    return c.json({ error: err?.message || "Internal server error" }, 500);
  }
});

// Reactivate admin endpoint - no auth required (for recovery)
app.post("/api/reactivate-admin", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: "Email required" }, 400);
    const { getDbReady } = await import("./queries/connection.js");
    const { users } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");
    const db = await getDbReady();
    const [admin] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!admin) return c.json({ error: "User not found" }, 404);
    await db.update(users).set({ isActive: true }).where(eq(users.email, email));
    return c.json({ success: true, message: "Admin account reactivated" });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Setup endpoint - creates database tables
// Uses Neon serverless driver when DATABASE_URL is a Postgres URL
// Falls back to SQLite for local development
app.post("/api/setup", async (c) => {
  try {
    const { env } = await import("./lib/env.js");

    if (!env.databaseUrl) {
      return c.json({ success: false, error: "DATABASE_URL not configured" }, 400);
    }

    const isNeon = env.databaseUrl.startsWith("postgres://") || env.databaseUrl.startsWith("postgresql://");

    if (isNeon) {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(env.databaseUrl);

      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          is_admin BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS searches (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          product_query VARCHAR(500) NOT NULL,
          ip_address VARCHAR(100),
          user_agent TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS images (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          url TEXT NOT NULL,
          prompt TEXT NOT NULL,
          width INTEGER NOT NULL DEFAULT 0,
          height INTEGER NOT NULL DEFAULT 0,
          content_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS chats (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          title VARCHAR(200) NOT NULL DEFAULT 'New Chat',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          chat_id INTEGER NOT NULL,
          role VARCHAR(20) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS generated_images (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          product_image_url TEXT NOT NULL,
          theme_title VARCHAR(200) NOT NULL,
          prompt TEXT NOT NULL,
          result_image_url TEXT,
          overlay_text VARCHAR(500),
          overlay_settings TEXT,
          final_image_url TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          user_name VARCHAR(100) NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_admin BOOLEAN NOT NULL DEFAULT false,
          is_read BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;
    } else {
      // Local SQLite — use sql.js directly (no dependency on connection module)
      const initSqlJs = (await import("sql.js")).default;
      const path = await import("path");
      const fs = await import("fs");

      const dbDir = path.resolve(process.cwd(), "data");
      const dbPath = path.resolve(dbDir, "app.db");

      // Ensure directory exists
      fs.mkdirSync(dbDir, { recursive: true });

      let buffer = null;
      try {
        buffer = fs.readFileSync(dbPath);
      } catch {
        // No existing DB file, will create from scratch
      }

      const SQL = await initSqlJs();
      const sqlJsDb = new SQL.Database(buffer);

      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_query TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        prompt TEXT NOT NULL,
        width INTEGER NOT NULL DEFAULT 0,
        height INTEGER NOT NULL DEFAULT 0,
        content_type TEXT NOT NULL DEFAULT 'image/jpeg',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT 'New Chat',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS generated_images (
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
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        message TEXT NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);

      // Save to disk
      const data = sqlJsDb.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
      sqlJsDb.close();
    }

    return c.json({ success: true, message: "Database tables created successfully" });
  } catch (err) {
    console.error("Setup failed:", err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

// Setup-tables endpoint - same as /api/setup, kept for compatibility
app.post("/api/setup-tables", async (c) => {
  try {
    const { env } = await import("./lib/env.js");

    if (!env.databaseUrl) {
      return c.json({ success: false, error: "DATABASE_URL not configured" }, 400);
    }

    const isNeon = env.databaseUrl.startsWith("postgres://") || env.databaseUrl.startsWith("postgresql://");

    if (isNeon) {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(env.databaseUrl);

      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          is_admin BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS searches (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          product_query VARCHAR(500) NOT NULL,
          ip_address VARCHAR(100),
          user_agent TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS images (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          url TEXT NOT NULL,
          prompt TEXT NOT NULL,
          width INTEGER NOT NULL DEFAULT 0,
          height INTEGER NOT NULL DEFAULT 0,
          content_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS chats (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          title VARCHAR(200) NOT NULL DEFAULT 'New Chat',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          chat_id INTEGER NOT NULL,
          role VARCHAR(20) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS generated_images (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          product_image_url TEXT NOT NULL,
          theme_title VARCHAR(200) NOT NULL,
          prompt TEXT NOT NULL,
          result_image_url TEXT,
          overlay_text VARCHAR(500),
          overlay_settings TEXT,
          final_image_url TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          user_name VARCHAR(100) NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_admin BOOLEAN NOT NULL DEFAULT false,
          is_read BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;
    } else {
      // Local SQLite — use sql.js directly (no dependency on connection module)
      const initSqlJs = (await import("sql.js")).default;
      const path = await import("path");
      const fs = await import("fs");

      const dbDir = path.resolve(process.cwd(), "data");
      const dbPath = path.resolve(dbDir, "app.db");

      // Ensure directory exists
      fs.mkdirSync(dbDir, { recursive: true });

      let buffer = null;
      try {
        buffer = fs.readFileSync(dbPath);
      } catch {
        // No existing DB file, will create from scratch
      }

      const SQL = await initSqlJs();
      const sqlJsDb = new SQL.Database(buffer);

      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_query TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        prompt TEXT NOT NULL,
        width INTEGER NOT NULL DEFAULT 0,
        height INTEGER NOT NULL DEFAULT 0,
        content_type TEXT NOT NULL DEFAULT 'image/jpeg',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT 'New Chat',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS generated_images (
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
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        message TEXT NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);

      // Save to disk
      const data = sqlJsDb.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
      sqlJsDb.close();
    }

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
// Note: This runs synchronously on Vercel (condition is false), so no top-level await needed
if (env.isProduction && !env.isVercel) {
  // Dynamic import to avoid loading @hono/node-server on Vercel
  import("@hono/node-server").then(({ serve }) => {
    import("./lib/vite.js").then(({ serveStaticFiles }) => {
      serveStaticFiles(app);
      const port = parseInt(process.env.PORT || "3000");
      serve({ fetch: app.fetch, port }, () => {
        console.log(`Server running on http://localhost:${port}/`);
      });
    });
  });
}
