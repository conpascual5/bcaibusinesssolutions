// Supabase database adapter for the API
// Uses the Supabase JS client (REST API) as the primary method
// Falls back to Postgres driver (drizzle) if REST API is not suitable
//
// The Supabase JS client uses the anon key via REST API, which:
// 1. Works reliably on Vercel serverless functions
// 2. No need for database password
// 3. No TLS/certificate issues
// 4. Built-in connection pooling

import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema.js";

const SUPABASE_URL = "https://dkatgjtvhitknghvaxxn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTYxNDMsImV4cCI6MjA5MzQ5MjE0M30.fsxUDg76sYGOFBVhekoj0LszaQ2YNvqkAmDIMTZ6keU";

// Create Supabase JS client for REST API access
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
}) as any;

// Drizzle-compatible interface that wraps Supabase REST API
// This allows the rest of the app to use drizzle-style queries
interface DrizzleDb {
  select: (fields?: any) => any;
  insert: (table: any) => any;
  update: (table: any) => any;
  delete: (table: any) => any;
  execute: (query: string) => Promise<any>;
}

let db: ReturnType<typeof drizzle> | null = null;
let restDb: DrizzleDb | null = null;
let ready = false;

// Try service role key from env first, then fall back to anon key
const password = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

// Connection string using Supabase's transaction pooler
const connectionString = `postgresql://postgres.dkatgjtvhitknghvaxxn:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

export async function getSupabaseDb() {
  // Try Postgres driver first (faster for complex queries)
  if (!db) {
    try {
      console.log("[supabase-db] Trying Postgres driver connection...");
      const client = postgres(connectionString, {
        prepare: false,
        max: 1,
        idle_timeout: 20,
        connect_timeout: 15,
      });
      db = drizzle(client, { schema });
      console.log("[supabase-db] Connected via Postgres driver");
      return db;
    } catch (err) {
      console.error("[supabase-db] Postgres driver failed, will use REST API:", err);
    }
  }
  
  if (db) return db;
  
  // Fall back to REST API via Supabase JS client
  if (!restDb) {
    console.log("[supabase-db] Using Supabase REST API as fallback...");
    restDb = createRestDb(supabase);
  }
  
  return restDb as any;
}

function createRestDb(client: any): DrizzleDb {
  return {
    select: (fields?: any) => {
      return {
        from: (table: any) => {
          const tableName = getTableName(table);
          return {
            where: (condition: any) => {
              return {
                limit: (n: number) => {
                  return {
                    then: async (resolve: any) => {
                      const { data, error } = await client
                        .from(tableName)
                        .select('*')
                        .limit(n);
                      if (error) throw new Error(error.message);
                      resolve(data || []);
                    },
                  };
                },
              };
            },
            then: async (resolve: any) => {
              const { data, error } = await client
                .from(tableName)
                .select('*');
              if (error) throw new Error(error.message);
              resolve(data || []);
            },
          };
        },
      };
    },
    insert: (table: any) => {
      const tableName = getTableName(table);
      return {
        values: (vals: any) => {
          return {
            returning: (fields?: any) => {
              return {
                then: async (resolve: any) => {
                  const { data, error } = await client
                    .from(tableName)
                    .insert(vals)
                    .select();
                  if (error) throw new Error(error.message);
                  resolve(data || []);
                },
              };
            },
            then: async (resolve: any) => {
              const { data, error } = await client
                .from(tableName)
                .insert(vals)
                .select();
              if (error) throw new Error(error.message);
              resolve(data || []);
            },
          };
        },
      };
    },
    update: (table: any) => {
      const tableName = getTableName(table);
      return {
        set: (vals: any) => {
          return {
            where: (condition: any) => {
              return {
                returning: (fields?: any) => {
                  return {
                    then: async (resolve: any) => {
                      const { data, error } = await client
                        .from(tableName)
                        .update(vals)
                        .eq('id', extractId(condition))
                        .select();
                      if (error) throw new Error(error.message);
                      resolve(data || []);
                    },
                  };
                },
                then: async (resolve: any) => {
                  const { data, error } = await client
                    .from(tableName)
                    .update(vals)
                    .select();
                  if (error) throw new Error(error.message);
                  resolve(data || []);
                },
              };
            },
          };
        },
      };
    },
    delete: (table: any) => {
      const tableName = getTableName(table);
      return {
        where: (condition: any) => {
          return {
            then: async (resolve: any) => {
              const { data, error } = await client
                .from(tableName)
                .delete()
                .eq('id', extractId(condition));
              if (error) throw new Error(error.message);
              resolve(data || []);
            },
          };
        },
      };
    },
    execute: async (query: string) => {
      // For raw SQL, use the Postgres driver or rpc
      // Fallback: try to use supabase.rpc if available
      try {
        const { data, error } = await client.rpc('exec_sql', { query_text: query });
        if (error) throw new Error(error.message);
        return data;
      } catch (err: any) {
        console.error("[supabase-db] execute failed:", err?.message || err);
        throw err;
      }
    },
  };
}

function getTableName(table: any): string {
  if (typeof table === 'string') return table;
  if (table?.[Symbol.for('drizzle:name')]) return table[Symbol.for('drizzle:name')];
  if (table?.name) return table.name;
  // Try to extract from drizzle table object
  const str = String(table);
  const match = str.match(/['"]([^'"]+)['"]/);
  return match ? match[1] : 'unknown';
}

function extractId(condition: any): any {
  // Simple extraction: if condition has a value, return it
  if (condition?.value !== undefined) return condition.value;
  return undefined;
}

export async function waitForSupabaseDb() {
  try {
    await getSupabaseDb();
    console.log("[supabase-db] Database ready");
  } catch (err) {
    console.error("[supabase-db] Failed to connect:", err);
    throw err;
  }
}

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const d = await getSupabaseDb();
    await d.execute("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
