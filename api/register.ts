// Standalone register endpoint — minimal imports for fast cold starts
// This bypasses the full tRPC pipeline so registration is instant even on cold starts

import { Hono } from "hono";

const registerApp = new Hono();

registerApp.post("/api/register", async (c) => {
  try {
    const { email, password, name, isExistingCustomer } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }
    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    const { env } = await import("./lib/env.js");
    const { getSupabaseClient } = await import("./queries/supabase-client.js");
    const { hashPassword, signJWT } = await import("./auth-utils.js");

    const supabase = getSupabaseClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if ((existing as any[])?.length) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const passwordHash = await hashPassword(password);

    // Check if this is the first user — make them admin
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const isAdmin = count === 0 ? 1 : 0;

    // Insert the user
    const { data: newUsers, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        name,
        is_active: 1,
        is_admin: isAdmin,
      } as any)
      .select();

    if (insertError) {
      console.error("[register] insert error:", insertError.message);
      return c.json({ error: "Failed to create account. Please try again." }, 500);
    }

    const user = (newUsers as any[])?.[0];
    if (!user) {
      return c.json({ error: "Failed to create account." }, 500);
    }

    // If existing customer, auto-create VIP subscription
    if (isExistingCustomer) {
      try {
        await (supabase.from("subscriptions") as any).insert({
          user_id: user.id,
          plan: "vip",
          status: "active",
        });
        console.log(`[register] VIP subscription created for user ${user.id} (${email})`);
      } catch (subErr: any) {
        console.error("[register] Failed to create VIP subscription:", subErr?.message ?? subErr);
      }
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
    console.error("[register] Error:", err?.message ?? err);
    return c.json({ error: err?.message || "Registration failed" }, 500);
  }
});

export default registerApp;
