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
    const { hashPassword, signJWT } = await import("./auth-utils.js");

    // Use the local SQLite database (same as the rest of the app)
    const { getDbReady, saveDb } = await import("./queries/connection.js");
    const db = await getDbReady() as any;

    // Check if email already exists in local DB
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const passwordHash = await hashPassword(password);

    // Check if this is the first user — make them admin
    const countResult = db.prepare("SELECT COUNT(*) as cnt FROM users").get();
    const isAdmin = (countResult?.cnt || 0) === 0 ? 1 : 0;

    // Insert the user into local SQLite DB
    const stmt = db.prepare(
      "INSERT INTO users (email, password_hash, name, is_active, is_admin) VALUES (?, ?, ?, 1, ?)"
    );
    const result = stmt.run(email, passwordHash, name, isAdmin);
    await saveDb();

    const userId = result.lastInsertRowid;

    // If existing customer, auto-create VIP subscription
    if (isExistingCustomer) {
      try {
        db.prepare(
          "INSERT INTO subscriptions (user_id, plan, status) VALUES (?, 'vip', 'active')"
        ).run(userId);
        await saveDb();
        console.log(`[register] VIP subscription created for user ${userId} (${email})`);
      } catch (subErr: any) {
        console.error("[register] Failed to create VIP subscription:", subErr?.message ?? subErr);
      }
    }

    // Generate JWT
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = {
      userId: Number(userId),
      email: email,
      isAdmin: !!isAdmin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    };
    const body = btoa(JSON.stringify(payload));
    const signature = btoa(env.jwtSecret);
    const token = `${header}.${body}.${signature}`;

    return c.json({
      token,
      user: {
        id: Number(userId),
        email: email,
        name: name,
        isAdmin: !!isAdmin,
      },
    });
  } catch (err: any) {
    console.error("[register] Error:", err?.message ?? err);
    return c.json({ error: err?.message || "Registration failed" }, 500);
  }
});

export default registerApp;
