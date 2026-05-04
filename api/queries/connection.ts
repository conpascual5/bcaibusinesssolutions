import { env } from "../lib/env.js";

// On Vercel, always use SQLite (pre-seeded during build) for reliability.
// Neon/Postgres is only used in non-Vercel environments when DATABASE_URL is set.
const useNeon = !env.isVercel && !!env.databaseUrl && (env.databaseUrl.startsWith("postgres://") || env.databaseUrl.startsWith("postgresql://"));

// Track whether Neon has been tried and failed — fall back to SQLite
let neonFailed = false;

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
  if (useNeon && !neonFailed) {
    try {
      return await getNeonDbReady();
    } catch (err: any) {
      console.error("[DB] Neon connection failed, falling back to SQLite:", err?.message ?? err);
      neonFailed = true;
    }
  }
  return getSqliteDbReady();
}

export async function waitForDb() {
  if (useNeon && !neonFailed) {
    try {
      return await waitForNeonDb();
    } catch (err: any) {
      console.error("[DB] Neon wait failed, falling back to SQLite:", err?.message ?? err);
      neonFailed = true;
    }
  }
  return waitForSqliteDb();
}

export async function testDbConnection(): Promise<boolean> {
  if (useNeon && !neonFailed) {
    try {
      return await testNeonConnection();
    } catch (err: any) {
      console.error("[DB] Neon test failed, falling back to SQLite:", err?.message ?? err);
      neonFailed = true;
    }
  }
  return testSqliteConnection();
}
