// Standalone login endpoint — minimal imports for fast cold starts
// This bypasses the full tRPC pipeline so login is instant even on cold starts

import { Hono } from "hono";

const loginApp = new Hono();

loginApp.post("/api/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password required" }, 400);
    }

    const { env } = await import("./lib/env.js");

    // Try local database first (SQLite or Neon)
    try {
      const { getDbReady } = await import("./queries/connection.js");
      const { users } = await import("../db/schema.js");
      const { eq } = await import("drizzle-orm");
      const db = await getDbReady();
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user) {
        return c.json({ error: "Invalid credentials" }, 401);
      }
      if (!user.isActive) {
        return c.json({ error: "Account deactivated" }, 403);
      }

      // Verify password using Web Crypto API (no node:crypto needed)
      const encoder = new TextEncoder();
      const data = encoder.encode(password + env.jwtSecret);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

      if (hash !== user.passwordHash) {
        return c.json({ error: "Invalid credentials" }, 401);
      }

      // Generate JWT
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = {
        userId: user.id,
        email: user.email,
        isAdmin: !!user.isAdmin,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      };
      const body = btoa(JSON.stringify(payload));
      const signature = btoa(env.jwtSecret);
      const token = `${header}.${body}.${signature}`;

      return c.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: !!user.isAdmin,
        },
      });
    } catch (dbErr: any) {
      console.error("[login] Local DB error, falling back to Supabase:", dbErr?.message ?? dbErr);
    }

    // Fallback: try Supabase
    const { createClient } = await import("@supabase/supabase-js");

    const SUPABASE_URL = "https://dkatgjtvhitknghvaxxn.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTYxNDMsImV4cCI6MjA5MzQ5MjE0M30.fsxUDg76sYGOFBVhekoj0LszaQ2YNvqkAmDIMTZ6keU";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: supabaseUsers, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) {
      console.error("[login] Supabase query error:", error.message);
      return c.json({ error: "Database error. Please try again." }, 500);
    }

    const user = supabaseUsers?.[0];
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }
    if (!user.is_active) {
      return c.json({ error: "Account deactivated" }, 403);
    }

    // Verify password
    const encoder = new TextEncoder();
    const data = encoder.encode(password + env.jwtSecret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

    if (hash !== user.password_hash) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Generate JWT
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = {
      userId: user.id,
      email: user.email,
      isAdmin: !!user.is_admin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    };
    const body = btoa(JSON.stringify(payload));
    const signature = btoa(env.jwtSecret);
    const token = `${header}.${body}.${signature}`;

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: !!user.is_admin,
      },
    });
  } catch (err: any) {
    console.error("[login] Error:", err?.message ?? err);
    return c.json({ error: err?.message || "Login failed" }, 500);
  }
});

export default loginApp;
