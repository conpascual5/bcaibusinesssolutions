import { env } from "../lib/env.js";

// Use Neon/Postgres when DATABASE_URL is set (works on both Vercel and local)
// Falls back to SQLite only when no DATABASE_URL is configured (local dev only)
const useNeon = !!env.databaseUrl && (env.databaseUrl.startsWith("postgres://") || env.databaseUrl.startsWith("postgresql://"));

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
  if (useNeon) {
    return getNeonDbReady();
  }
  return getSqliteDbReady();
}

export async function waitForDb() {
  if (useNeon) {
    return waitForNeonDb();
  }
  return waitForSqliteDb();
}

export async function testDbConnection(): Promise<boolean> {
  if (useNeon) {
    return testNeonConnection();
  }
  return testSqliteConnection();
}
