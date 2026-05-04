import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";

let db: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;

const TABLE_CREATION_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    product_query VARCHAR(500) NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    content_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS generated_images (
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
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
];

async function ensureTables(d: ReturnType<typeof drizzle>) {
  try {
    await (d as any).execute(`SELECT 1 FROM users LIMIT 1`);
    return; // tables exist
  } catch {
    // tables don't exist — create them
  }
  for (const sql of TABLE_CREATION_SQL) {
    await (d as any).execute(sql);
  }
}

export async function getNeonDb() {
  if (!db) {
    const sql = neon(env.databaseUrl);
    const newDb = drizzle(sql, {
      schema: { ...schema, ...relations },
      logger: false,
    }) as any;
    db = newDb;

    initPromise = ensureTables(newDb).catch((err) => {
      console.error("[Neon DB] Table creation failed:", err);
      throw err;
    });
  }
  return db!;
}

export async function waitForNeonDb() {
  await getNeonDb();
  if (initPromise) {
    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error("Neon DB initialization timed out after 25 seconds")), 25000)
    );
    await Promise.race([initPromise, timeoutPromise]);
  }
}

export async function getNeonDbReady() {
  await waitForNeonDb();
  return db!;
}

export async function testNeonConnection(): Promise<boolean> {
  try {
    await waitForNeonDb();
    const d = db!;
    await (d as any).execute("SELECT 1");
    return true;
  } catch (err) {
    console.error("Neon DB connection test failed:", err);
    return false;
  }
}
