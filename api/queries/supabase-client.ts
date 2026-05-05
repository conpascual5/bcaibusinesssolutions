// Supabase client for server-side use in the API
// Uses the service role key for admin access (bypasses RLS)
// Falls back to anon key if service role key is not available

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dkatgjtvhitknghvaxxn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTYxNDMsImV4cCI6MjA5MzQ5MjE0M30.fsxUDg76sYGOFBVhekoj0LszaQ2YNvqkAmDIMTZ6keU";

// Use service role key from env if available
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let supabase: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabase) {
    const key = serviceRoleKey || SUPABASE_ANON_KEY;
    supabase = createClient(SUPABASE_URL, key);
    console.log("[supabase-client] Created Supabase client" + (serviceRoleKey ? " (service role)" : " (anon)"));
  }
  return supabase;
}
