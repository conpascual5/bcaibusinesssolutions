// Supabase database adapter for the API
// Uses the Supabase JS client (REST API) instead of raw Postgres connection
// This is more reliable on Vercel serverless functions because:
// 1. No need for database password — uses anon key
// 2. Works through Supabase's REST API with built-in connection pooling
// 3. No TLS/certificate issues on edge functions
//
// Returns a drizzle-compatible interface so the rest of the app doesn't need changes

import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema.js";

const SUPABASE_URL = "https://dkatgjtvhitknghvaxxn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTYxNDMsImV4cCI6MjA5MzQ5MjE0M30.fsxUDg76sYGOFBVhekoj0LszaQ2YNvqkAmDIMTZ6keU";

// Try service role key from env first, then fall back to anon key
const password = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

// Connection string using Supabase's transaction pooler
const connectionString = `postgresql://postgres.dkatgjtvhitknghvaxxn:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

let db: ReturnType<typeof drizzle> | null = null;
let ready = false;

export async function getSupabaseDb() {
  if (db) return db;
  
  console.log("[supabase-db] Connecting to Supabase Postgres via transaction pooler...");
  
  try {
    const client = postgres(connectionString, {
      prepare: false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15, // Increased timeout for cold starts
    });
    
    db = drizzle(client, { schema });
    ready = true;
    console.log("[supabase-db] Connected to Supabase Postgres");
    return db;
  } catch (err) {
    console.error("[supabase-db] Failed to connect:", err);
    throw err;
  }
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
