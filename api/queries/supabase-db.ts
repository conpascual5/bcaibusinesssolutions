// Supabase database adapter for the API
// Uses the Supabase JS client (REST API) as the primary method
// The Supabase JS client uses the anon key via REST API, which:
// 1. Works reliably on Vercel serverless functions
// 2. No need for database password
// 3. No TLS/certificate issues
// 4. Built-in connection pooling
// 5. Connects instantly (HTTP request, no TCP handshake delay)

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dkatgjtvhitknghvaxxn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTYxNDMsImV4cCI6MjA5MzQ5MjE0M30.fsxUDg76sYGOFBVhekoj0LszaQ2YNvqkAmDIMTZ6keU";

// Create Supabase JS client for REST API access
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Drizzle-compatible interface that wraps Supabase REST API
// This allows the rest of the app to use drizzle-style queries
interface DrizzleDb {
  select: (fields?: any) => any;
  insert: (table: any) => any;
  update: (table: any) => any;
  delete: (table: any) => any;
  execute: (query: string) => Promise<any>;
}

let restDb: DrizzleDb | null = null;

export async function getSupabaseDb() {
  if (!restDb) {
    console.log("[supabase-db] Using Supabase REST API...");
    restDb = createRestDb(supabase);
  }
  return restDb as any;
}

function getTableName(table: any): string {
  if (typeof table === 'string') return table;
  const drizzleName = table?.[Symbol.for('drizzle:name')];
  if (drizzleName) {
    console.log("[supabase-db] getTableName via drizzle:name:", drizzleName);
    return drizzleName;
  }
  if (table?.name) {
    console.log("[supabase-db] getTableName via .name:", table.name);
    return table.name;
  }
  const str = String(table);
  const match = str.match(/['\"]([^'\"]+)['\"]/);
  const result = match ? match[1] : 'unknown';
  console.log("[supabase-db] getTableName via regex:", result);
  return result;
}

// Extract column name and value from a drizzle eq() condition
// Drizzle eq() creates an object like: { column: ..., value: ..., table: ... }
// or it could be a raw comparison object
function extractCondition(condition: any): { column: string; value: any } | null {
  if (!condition) {
    console.log("[supabase-db] extractCondition: null condition");
    return null;
  }
  
  console.log("[supabase-db] extractCondition keys:", Object.keys(condition), "has column?", condition.column !== undefined, "has value?", condition.value !== undefined);
  
  // Drizzle's eq() creates an object with column and value properties
  if (condition.column !== undefined && condition.value !== undefined) {
    // Get column name from the column object
    let columnName = '';
    if (typeof condition.column === 'string') {
      columnName = condition.column;
    } else if (condition.column?.name) {
      columnName = condition.column.name;
    } else if (condition.column?.columnName) {
      columnName = condition.column.columnName;
    } else {
      // Try to stringify
      columnName = String(condition.column);
    }
    console.log("[supabase-db] extractCondition result:", { column: columnName, value: condition.value });
    return { column: columnName, value: condition.value };
  }
  
  // Handle raw comparison objects like { column: 'id', value: 1 }
  if (condition.column && condition.value !== undefined) {
    console.log("[supabase-db] extractCondition raw result:", { column: condition.column, value: condition.value });
    return { column: condition.column, value: condition.value };
  }
  
  console.log("[supabase-db] extractCondition: could not extract");
  return null;
}

// Extract ordering info from drizzle orderBy/desc
function extractOrder(orderBy: any): { column: string; direction: 'asc' | 'desc' } | null {
  if (!orderBy) return null;
  
  // Check if it's a desc() wrapper
  if (orderBy?.config?.isDesc === true || orderBy?.isDesc) {
    const inner = orderBy.config?.field || orderBy.field || orderBy;
    let columnName = '';
    if (typeof inner === 'string') columnName = inner;
    else if (inner?.name) columnName = inner.name;
    else if (inner?.columnName) columnName = inner.columnName;
    else columnName = String(inner);
    return { column: columnName, direction: 'desc' };
  }
  
  // Plain column reference
  let columnName = '';
  if (typeof orderBy === 'string') columnName = orderBy;
  else if (orderBy?.name) columnName = orderBy.name;
  else if (orderBy?.columnName) columnName = orderBy.columnName;
  else columnName = String(orderBy);
  
  return { column: columnName, direction: 'asc' };
}

function createRestDb(client: any): DrizzleDb {
  return {
    select: (fields?: any) => {
      return {
        from: (table: any) => {
          const tableName = getTableName(table);
          console.log("[supabase-db] select.from:", tableName);
          let query: any = client.from(tableName).select('*');
          
          const chain: any = {
            where: (condition: any) => {
              const extracted = extractCondition(condition);
              if (extracted) {
                console.log("[supabase-db] select.where:", extracted.column, "=", extracted.value);
                query = query.eq(extracted.column, extracted.value);
              } else {
                console.log("[supabase-db] select.where: could not extract condition");
              }
              return chain;
            },
            orderBy: (orderBy: any) => {
              const extracted = extractOrder(orderBy);
              if (extracted) {
                query = query.order(extracted.column, { ascending: extracted.direction === 'asc' });
              }
              return chain;
            },
            limit: (n: number) => {
              query = query.limit(n);
              return chain;
            },
            then: async (resolve: any) => {
              console.log("[supabase-db] select executing...");
              const { data, error } = await query;
              if (error) {
                console.log("[supabase-db] select error:", error.message);
                throw new Error(error.message);
              }
              console.log("[supabase-db] select result:", data?.length, "rows");
              resolve(data || []);
            },
          };
          
          return chain;
        },
      };
    },
    insert: (table: any) => {
      const tableName = getTableName(table);
      console.log("[supabase-db] insert into:", tableName);
      return {
        values: (vals: any) => {
          console.log("[supabase-db] insert values:", JSON.stringify(vals));
          return {
            returning: (fields?: any) => {
              return {
                then: async (resolve: any) => {
                  console.log("[supabase-db] insert executing...");
                  const { data, error } = await client
                    .from(tableName)
                    .insert(vals)
                    .select();
                  if (error) {
                    console.log("[supabase-db] insert error:", error.message);
                    throw new Error(error.message);
                  }
                  console.log("[supabase-db] insert result:", data?.length, "rows");
                  resolve(data || []);
                },
              };
            },
            then: async (resolve: any) => {
              console.log("[supabase-db] insert executing...");
              const { data, error } = await client
                .from(tableName)
                .insert(vals)
                .select();
              if (error) {
                console.log("[supabase-db] insert error:", error.message);
                throw new Error(error.message);
              }
              console.log("[supabase-db] insert result:", data?.length, "rows");
              resolve(data || []);
            },
          };
        },
      };
    },
    update: (table: any) => {
      const tableName = getTableName(table);
      console.log("[supabase-db] update table:", tableName);
      return {
        set: (vals: any) => {
          console.log("[supabase-db] update set:", JSON.stringify(vals));
          return {
            where: (condition: any) => {
              const extracted = extractCondition(condition);
              let query = client.from(tableName).update(vals).select();
              if (extracted) {
                console.log("[supabase-db] update where:", extracted.column, "=", extracted.value);
                query = query.eq(extracted.column, extracted.value);
              }
              return {
                returning: (fields?: any) => {
                  return {
                    then: async (resolve: any) => {
                      console.log("[supabase-db] update executing...");
                      const { data, error } = await query;
                      if (error) {
                        console.log("[supabase-db] update error:", error.message);
                        throw new Error(error.message);
                      }
                      console.log("[supabase-db] update result:", data?.length, "rows");
                      resolve(data || []);
                    },
                  };
                },
                then: async (resolve: any) => {
                  console.log("[supabase-db] update executing...");
                  const { data, error } = await query;
                  if (error) {
                    console.log("[supabase-db] update error:", error.message);
                    throw new Error(error.message);
                  }
                  console.log("[supabase-db] update result:", data?.length, "rows");
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
    delete: (table: any) => {
      const tableName = getTableName(table);
      return {
        where: (condition: any) => {
          const extracted = extractCondition(condition);
          let query = client.from(tableName).delete();
          if (extracted) {
            query = query.eq(extracted.column, extracted.value);
          }
          return {
            then: async (resolve: any) => {
              const { data, error } = await query;
              if (error) throw new Error(error.message);
              resolve(data || []);
            },
          };
        },
      };
    },
    execute: async (query: string) => {
      // execute is not supported via REST API — tables must be created via SQL migration
      console.warn("[supabase-db] execute() not supported via REST API. Tables should be pre-created.");
      return [];
    },
  };
}

export async function waitForSupabaseDb() {
  try {
    await getSupabaseDb();
    // Verify connection by listing users
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error("[supabase-db] Connection test failed:", error.message);
      throw error;
    }
    console.log("[supabase-db] Database ready");
  } catch (err) {
    console.error("[supabase-db] Failed to connect:", err);
    throw err;
  }
}

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const d = await getSupabaseDb() as any;
    const { data, error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
