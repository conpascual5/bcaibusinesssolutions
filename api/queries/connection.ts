import { env } from "../lib/env.js";
import { getNeonDbReady, waitForNeonDb, testNeonConnection } from "./neon-connection.js";

// If DATABASE_URL is a Postgres connection string, use Neon. Otherwise fall back to SQLite.
const useNeon = !!env.databaseUrl && (env.databaseUrl.startsWith("postgres://") || env.databaseUrl.startsWith("postgresql://"));

export async function getDbReady() {
  if (useNeon) {
    return getNeonDbReady();
  }
  // Dynamic import for SQLite — only loaded when not using Neon
  const { getDbReady: getSqliteDbReady } = await import("./sqlite-connection.js");
  return getSqliteDbReady();
}

export async function waitForDb() {
  if (useNeon) {
    return waitForNeonDb();
  }
  const { waitForDb: waitForSqliteDb } = await import("./sqlite-connection.js");
  return waitForSqliteDb();
}

export async function testDbConnection(): Promise<boolean> {
  if (useNeon) {
    return testNeonConnection();
  }
  const { testDbConnection: testSqliteConnection } = await import("./sqlite-connection.js");
  return testSqliteConnection();
}
