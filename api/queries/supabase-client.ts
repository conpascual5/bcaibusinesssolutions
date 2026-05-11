// Supabase client for server-side use in the API
// Uses the service role key for admin operations (bypasses RLS)
// Falls back to anon key if service role key is not available

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dkatgjtvhitknghvaxxn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTYxNDMsImV4cCI6MjA5MzQ5MjE0M30.fsxUDg76sYGOFBVhekoj0LszaQ2YNvqkAmDIMTZ6keU";

// IMPORTANT: In this app environment we don't have a safe way to use the service role key.
// So the API client MUST use the user's JWT (passed via Authorization header) to act as that user.
// This keeps RLS + admin policies working correctly.

export function getSupabaseClient(userJwt?: string | null) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: userJwt ? { Authorization: `Bearer ${userJwt}` } : {},
    },
  });
}

/** Get an anon-key client (no user JWT). */
export function getAnonSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
