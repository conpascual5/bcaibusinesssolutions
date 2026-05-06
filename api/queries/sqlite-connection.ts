import initSqlJs from "sql.js";
import type { Database as SqlJsDatabase } from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";
import path from "path";
import fs from "fs";

let db: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;
let sqlJsDb: SqlJsDatabase | null = null;
let sqlInit: Awaited<ReturnType<typeof initSqlJs>> | null = null;

const TABLE_CREATION_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_admin INTEGER NOT NULL DEFAULT 0,
    plan TEXT NOT NULL DEFAULT 'free',
    activated_at TEXT,
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
  `CREATE TABLE IF NOT EXISTS sales_wizard_saves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    product_name TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    message_context TEXT,
    content_type TEXT NOT NULL,
    framework TEXT NOT NULL,
    framework_name TEXT NOT NULL,
    output TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS user_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    feature TEXT NOT NULL,
    month TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS plan_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan TEXT NOT NULL,
    previous_plan TEXT,
    set_by TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

/** Check if tables exist by trying a simple query */
function tablesExist(d: ReturnType<typeof drizzle>): boolean {
  try {
    (d as any).run(`SELECT 1 FROM users LIMIT 1`);
    return true;
  } catch {
    return false;
  }
}

/** Create tables synchronously (much faster than async for SQL.js) */
function createTablesSync(sqlJsDb: SqlJsDatabase) {
  for (const sql of TABLE_CREATION_SQL) {
    sqlJsDb.run(sql);
  }
}

export async function getDb() {
  if (!db) {
    // Pre-load SQL.js WASM if not already loaded
    if (!sqlInit) {
      sqlInit = await initSqlJs();
    }
    const SQL = sqlInit;

    // On Vercel, use /tmp which is writable; otherwise use local data dir
    const dbDir = env.isVercel ? "/tmp/data" : path.resolve(process.cwd(), "data");
    const dbPath = path.resolve(dbDir, "app.db");

    // Ensure directory exists
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch {}

    let buffer: Buffer | null = null;
    let loadedFromSeed = false;

    // Try loading the writable DB first (has user data)
    try {
      buffer = fs.readFileSync(dbPath);
    } catch {
      // Fall back to the pre-seeded DB bundled with the deployment
      try {
        const seedPath = path.resolve(process.cwd(), "public", "seed.db");
        buffer = fs.readFileSync(seedPath);
        loadedFromSeed = true;
      } catch {
        // No pre-seeded DB either — will create from scratch
      }
    }

    sqlJsDb = new SQL.Database(buffer);

    // Auto-save to disk
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

    process.on("exit", saveDb);
    process.on("SIGINT", () => { saveDb(); process.exit(0); });
    process.on("SIGTERM", () => { saveDb(); process.exit(0); });

    const newDb = drizzle(sqlJsDb, {
      schema: { ...schema, ...relations },
      logger: false,
    }) as any;

    // Expose saveDb for manual saving after write operations
    (newDb as any).__saveDb = saveDb;

    db = newDb;

    // If loaded from pre-seeded seed.db, tables already exist — skip creation
    if (loadedFromSeed && tablesExist(newDb)) {
      initPromise = Promise.resolve();
    } else {
      // Create tables synchronously (fast for SQL.js)
      try {
        createTablesSync(sqlJsDb);

        // Migration: add plan column to users table if it doesn't exist
        try {
          sqlJsDb.run("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'");
        } catch {
          // Column already exists — ignore
        }

        // Seed admin user if not exists
        // Use Web Crypto API to match the hash format used by auth-utils.ts
        const encoder = new TextEncoder();
        const seedData = encoder.encode("admin123" + env.jwtSecret);
        const seedHashBuffer = await crypto.subtle.digest("SHA-256", seedData);
        const adminHash = btoa(String.fromCharCode(...new Uint8Array(seedHashBuffer)));
        sqlJsDb.run(
          `INSERT OR IGNORE INTO users (email, password_hash, name, is_active, is_admin)
           VALUES ('conpascual5@gmail.com', ?, 'BC AI Admin', 1, 1)`,
          [adminHash]
        );

        saveDb();
        initPromise = Promise.resolve();
      } catch (err) {
        initPromise = Promise.reject(err);
      }
    }
  }
  return db!;
}

/** Wait for the database to be fully initialized */
export async function waitForDb() {
  await getDb();
  if (initPromise) {
    // Shorter timeout for Vercel (10s) vs local (25s)
    const timeoutMs = env.isVercel ? 10000 : 25000;
    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error(`Database initialization timed out after ${timeoutMs / 1000}s`)), timeoutMs)
    );
    await Promise.race([initPromise, timeoutPromise]);
  }
}

/**
 * Get the database instance after ensuring tables are created.
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
