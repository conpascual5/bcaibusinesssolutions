import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";
import path from "path";

let db: ReturnType<typeof drizzle> | null = null;
let sqliteDb: Database.Database | null = null;

export function getDb() {
  if (!db) {
    const dbPath = env.databaseUrl || path.resolve(process.cwd(), "data/app.db");
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma("journal_mode = WAL");
    sqliteDb.pragma("foreign_keys = ON");

    db = drizzle(sqliteDb, {
      schema: { ...schema, ...relations },
      logger: false,
    }) as any;
  }
  return db!;
}

export async function testDbConnection(): Promise<boolean> {
  try {
    const d = getDb();
    d.run("SELECT 1");
    return true;
  } catch (err) {
    console.error("DB connection test failed:", err);
    return false;
  }
}
