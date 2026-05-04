import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";
import path from "path";
import { mkdirSync } from "fs";

let db: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;

async function ensureTables(d: ReturnType<typeof drizzle>) {
  try {
    await (d as any).run(`SELECT 1 FROM users LIMIT 1`);
    return; // tables exist
  } catch {
    // tables don't exist — create them
  }
  await (d as any).run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  await (d as any).run(`CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_query TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  await (d as any).run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  await (d as any).run(`CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    content_type TEXT NOT NULL DEFAULT 'image/jpeg',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  await (d as any).run(`CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  await (d as any).run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  await (d as any).run(`CREATE TABLE IF NOT EXISTS generated_images (
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
  await (d as any).run(`CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    message TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
}

export function getDb() {
  if (!db) {
    // On Vercel, use /tmp which is writable; otherwise use local data dir
    const dbDir = env.isVercel ? "/tmp/data" : path.resolve(process.cwd(), "data");
    const dbPath = path.resolve(dbDir, "app.db");

    // Ensure directory exists
    try {
      mkdirSync(dbDir, { recursive: true });
    } catch {}

    const client = createClient({
      url: `file:${dbPath}`,
    });
    const newDb = drizzle(client, {
      schema: { ...schema, ...relations },
      logger: false,
    }) as any;
    db = newDb;

    // Ensure tables exist (fire and forget — tables are created lazily)
    ensureTables(newDb).catch((err) => console.error("[DB] Table creation failed:", err));
  }
  return db!;
}

/** Wait for the database to be fully initialized (tables created) */
export async function waitForDb() {
  getDb();
  if (initPromise) await initPromise;
}

export async function testDbConnection(): Promise<boolean> {
  try {
    await waitForDb();
    const d = getDb();
    await d.run("SELECT 1");
    return true;
  } catch (err) {
    console.error("DB connection test failed:", err);
    return false;
  }
}
