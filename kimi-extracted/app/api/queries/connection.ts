import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: any;
let pool: mysql.Pool;

export function getDb() {
  if (!instance) {
    pool = mysql.createPool({
      uri: env.databaseUrl,
      connectTimeout: 10000,
      connectionLimit: 5,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });

    instance = drizzle(pool, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return instance;
}

/**
 * Test if the database connection is working.
 * Returns true if connected, false otherwise.
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const db = getDb();
    await db.select().from(schema.users).limit(1);
    return true;
  } catch {
    return false;
  }
}
