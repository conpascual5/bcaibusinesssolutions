import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";
import path from "path";
import fs from "fs";

let db: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;
let sqlJsDb: SqlJsDatabase | null = null;

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

export async function getDb() {
  if (!db) {
    const SQL = await initSqlJs();
    
    // On Vercel, use /tmp which is writable; otherwise use local data dir
    const dbDir = env.isVercel ? "/tmp/data" : path.resolve(process.cwd(), "data");
    const dbPath = path.resolve(dbDir, "app.db");

    // Ensure directory exists
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch {}

    let buffer: Buffer | null = null;
    try {
      buffer = fs.readFileSync(dbPath);
    } catch {
      // File doesn't exist yet, will create new DB
    }

    sqlJsDb = new SQL.Database(buffer);
    
    // Auto-save to disk periodically
    const saveDb = () => {
      try {
        if (sqlJsDb) {
          const data = sqlJsDb.export();
          fs.mkdirSync(dbDir, { recursive: true });
          fs.writeFileSync(dbPath, Buffer.from(data));
        }
      } catch (err) {
        console.error("[DB] Save failed:", err);
      }
    };

    // Save on process exit
    process.on("exit", saveDb);
    // Save on SIGINT/SIGTERM
    process.on("SIGINT", () => { saveDb(); process.exit(0); });
    process.on("SIGTERM", () => { saveDb(); process.exit(0); });

    const newDb = drizzle(sqlJsDb, {
      schema: { ...schema, ...relations },
      logger: false,
    }) as any;
    db = newDb;

    // Start table creation and store the promise
    initPromise = ensureTables(newDb).then(() => {
      saveDb(); // Save after creating tables
    }).catch((err) => {
      console.error("[DB] Table creation failed:", err);
      throw err;
    });
  }
  return db!;
}

/** Wait for the database to be fully initialized (tables created) */
export async function waitForDb() {
  await getDb();
  if (initPromise) await initPromise;
}

/**
 * Get the database instance after ensuring tables are created.
 * This is the preferred way to get the DB — it waits for initialization.
 */
export async function getDbReady() {
  await waitForDb();
  return db!;
}

export async function testDbConnection(): Promise<boolean> {
  try {
    await waitForDb();
    const d = db!;
    await d.run("SELECT 1");
    return true;
  } catch (err) {
    console.error("DB connection test failed:", err);
    return false;
  }
}
