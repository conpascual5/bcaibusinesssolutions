import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";

let db: ReturnType<typeof drizzle> | null = null;

/**
 * Creates the Neon database client with drizzle schema.
 * No connectivity check — just create the client and return.
 * This keeps cold starts fast.
 */
export async function getNeonDb() {
  if (!db) {
    const sql = neon(env.databaseUrl);
    db = drizzle(sql, {
      schema: { ...schema, ...relations },
      logger: false,
    }) as any;
  }
  return db!;
}

export async function waitForNeonDb() {
  await getNeonDb();
}

export async function getNeonDbReady() {
  return getNeonDb();
}

export async function testNeonConnection(): Promise<boolean> {
  try {
    const d = await getNeonDb();
    await (d as any).execute("SELECT 1");
    return true;
  } catch (err) {
    console.error("Neon DB connection test failed:", err);
    return false;
  }
}
