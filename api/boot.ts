import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { env } from "./lib/env.js";

const app = new Hono();

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

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// Setup endpoint - creates database tables directly (uses child_process, won't work on Vercel)
app.post("/api/setup", async (c) => {
  if (env.isVercel) {
    return c.json({ success: false, error: "Use /api/setup-tables on Vercel" }, 400);
  }
  try {
    const { execSync } = await import("child_process");
    const { resolve } = await import("path");
    const root = resolve(process.cwd());

    console.log("Running push-schema script...");
    execSync("node scripts/push-schema.mjs", { cwd: root, stdio: "inherit", timeout: 30000 });
    console.log("Schema pushed successfully!");

    return c.json({ success: true, message: "Database tables created successfully" });
  } catch (err) {
    console.error("Setup failed:", err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

// Setup-tables endpoint - creates tables directly via DB connection (works on Vercel)
app.post("/api/setup-tables", async (c) => {
  try {
    const { getDb } = await import("./queries/connection.js");
    const db = getDb();

    // Create tables using raw SQL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS searches (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product_query VARCHAR(500) NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(100) NOT NULL UNIQUE,
        \`value\` TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS images (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        url TEXT NOT NULL,
        prompt TEXT NOT NULL,
        width INT NOT NULL DEFAULT 0,
        height INT NOT NULL DEFAULT 0,
        content_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL DEFAULT 'New Chat',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS generated_images (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_image_url TEXT NOT NULL,
        theme_title VARCHAR(200) NOT NULL,
        prompt TEXT NOT NULL,
        result_image_url TEXT,
        overlay_text VARCHAR(500),
        overlay_settings JSON,
        final_image_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
