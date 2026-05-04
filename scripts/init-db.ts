/**
 * This script creates a pre-seeded SQLite database file that gets bundled
 * with the Vercel deployment (only used when DATABASE_URL is not set).
 * When DATABASE_URL is set (Neon/Postgres), tables are created at runtime.
 */
const DATABASE_URL = process.env.DATABASE_URL;

// If using Neon/Postgres, skip SQLite pre-seeding
if (DATABASE_URL && !DATABASE_URL.startsWith("./") && !DATABASE_URL.startsWith("/")) {
  console.log("DATABASE_URL detected — skipping SQLite pre-seeding (using Neon/Postgres)");
  process.exit(0);
}

import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";

const TABLE_CREATION_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_query TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    content_type TEXT NOT NULL DEFAULT 'image/jpeg',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS generated_images (
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
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    message TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

async function main() {
  console.log("Initializing SQL.js...");
  const SQL = await initSqlJs();
  const sqlJsDb = new SQL.Database();

  console.log("Creating tables...");
  for (const sql of TABLE_CREATION_SQL) {
    sqlJsDb.run(sql);
  }

  const outDir = path.resolve(process.cwd(), "public");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.resolve(outDir, "seed.db");
  const data = sqlJsDb.export();
  fs.writeFileSync(outPath, Buffer.from(data));
  console.log(`Pre-seeded database written to ${outPath} (${data.length} bytes)`);

  sqlJsDb.close();
}

main().catch((err) => {
  console.error("Failed to create pre-seeded database:", err);
  process.exit(1);
});
