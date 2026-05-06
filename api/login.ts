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
    const { getSupabaseClient } = await import("./queries/supabase-client.js");

    const supabase = getSupabaseClient();

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) {
      console.error("[login] Supabase query error:", error.message);
      return c.json({ error: "Database error. Please try again." }, 500);
    }

    const user = users?.[0];
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }
    if (!user.is_active) {
      return c.json({ error: "Account deactivated" }, 403);
    }

    // Verify password using Web Crypto API (no node:crypto needed)
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
