import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";

let db: ReturnType<typeof drizzle> | null = null;
let pool: mysql.Pool | null = null;

export function getDb() {
  if (!db) {
    const connectionLimit = env.isVercel ? 1 : 5;

    pool = mysql.createPool({
      uri: env.databaseUrl,
      waitForConnections: true,
      connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      // On Vercel, don't use SSL config that might cause issues
      ...(env.databaseUrl.includes("ssl=true") || env.databaseUrl.includes("sslmode=require") || env.databaseUrl.includes("sslmode=required")
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
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
