import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";
import path from "path";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const dbPath = env.databaseUrl || path.resolve(process.cwd(), "data/app.db");
    const client = createClient({
      url: `file:${dbPath}`,
    });
    db = drizzle(client, {
      schema: { ...schema, ...relations },
      logger: false,
    }) as any;
  }
  return db!;
}

export async function testDbConnection(): Promise<boolean> {
  try {
    const d = getDb();
    await d.run("SELECT 1");
    return true;
  } catch (err) {
    console.error("DB connection test failed:", err);
    return false;
  }
}
