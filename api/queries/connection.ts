import { env } from "../lib/env.js";

// On Vercel, use Supabase (Postgres via JS client) for fast cold starts
// Falls back to Neon when DATABASE_URL is set (local dev with Postgres)
// Falls back to SQLite when nothing is configured (local dev only)
const useSupabase = !!env.isVercel;
const useNeon = !env.isVercel && !!env.databaseUrl && (env.databaseUrl.startsWith("postgres://") || env.databaseUrl.startsWith("postgresql://"));

async function getSupabaseDbReady() {
  const { getSupabaseDb } = await import("./supabase-db.js");
  return getSupabaseDb();
}

async function waitForSupabaseDb() {
  const { waitForSupabaseDb: wait } = await import("./supabase-db.js");
  return wait();
}

async function testSupabaseConnection() {
  const { testSupabaseConnection: test } = await import("./supabase-db.js");
  return test();
}

async function getNeonDbReady() {
  const { getNeonDbReady: neonGetReady } = await import("./neon-connection.js");
  return neonGetReady();
}

async function waitForNeonDb() {
  const { waitForNeonDb: neonWait } = await import("./neon-connection.js");
  return neonWait();
}

async function testNeonConnection() {
  const { testNeonConnection: neonTest } = await import("./neon-connection.js");
  return neonTest();
}

async function getSqliteDbReady() {
  const { getDbReady: sqliteGetReady } = await import("./sqlite-connection.js");
  return sqliteGetReady();
}

async function waitForSqliteDb() {
  const { waitForDb: sqliteWait } = await import("./sqlite-connection.js");
  return sqliteWait();
}

async function testSqliteConnection() {
  const { testDbConnection: sqliteTest } = await import("./sqlite-connection.js");
  return sqliteTest();
}

export async function getDbReady() {
  if (useSupabase) {
    return getSupabaseDbReady();
  }
  if (useNeon) {
    return getNeonDbReady();
  }
  return getSqliteDbReady();
}

export async function waitForDb() {
  if (useSupabase) {
    return waitForSupabaseDb();
  }
  if (useNeon) {
    return waitForNeonDb();
  }
  return waitForSqliteDb();
}

export async function testDbConnection(): Promise<boolean> {
  if (useSupabase) {
    return testSupabaseConnection();
  }
  if (useNeon) {
    return testNeonConnection();
  }
  return testSqliteConnection();
}

/** Save the SQLite database to disk (only needed for SQL.js in-memory DB) */
export async function saveDb() {
  if (useSupabase || useNeon) return;
  const db = await getDbReady() as any;
  if (db.__saveDb) {
    db.__saveDb();
  }
}
