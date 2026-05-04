import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";

let db: ReturnType<typeof drizzle> | null = null;
let pool: mysql.Pool | null = null;

export function getDb() {
  if (!db) {
    pool = mysql.createPool({
      uri: env.databaseUrl,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: env.databaseUrl.includes("ssl=true") || env.databaseUrl.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    });

    db = drizzle(pool, {
      schema: { ...schema, ...relations },
      mode: "default",
      logger: false,
    }) as any;
  }
  return db!;
}

export async function testDbConnection(): Promise<boolean> {
  try {
    const d = getDb();
    await d.execute("SELECT 1");
    return true;
  } catch (err) {
    console.error("DB connection test failed:", err);
    return false;
  }
}
