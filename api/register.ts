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
    const { getDbReady, getRawDb, saveDb } = await import("./queries/connection.js");
    await getDbReady();
    const sqlJsDb = await getRawDb();
    if (!sqlJsDb) {
      return c.json({ error: "Database not initialized" }, 500);
    }

    // Check if email already exists in local DB
    const existingStmt = sqlJsDb.prepare("SELECT id FROM users WHERE email = ?");
    existingStmt.bind([email]);
    if (existingStmt.step()) {
      existingStmt.free();
      return c.json({ error: "Email already registered" }, 409);
    }
    existingStmt.free();

    const passwordHash = await hashPassword(password);

    // Check if this is the first user — make them admin
    const countStmt = sqlJsDb.prepare("SELECT COUNT(*) as cnt FROM users");
    countStmt.step();
    const countResult = countStmt.getAsObject() as { cnt: number };
    countStmt.free();
    const isAdmin = countResult.cnt === 0 ? 1 : 0;

    // Insert the user into local SQLite DB
    sqlJsDb.run(
      "INSERT INTO users (email, password_hash, name, is_active, is_admin) VALUES (?, ?, ?, 1, ?)",
      [email, passwordHash, name, isAdmin]
    );
    const userId = Number(sqlJsDb.exec("SELECT last_insert_rowid()")[0]?.values?.[0]?.[0] ?? 0);
    await saveDb();

    // If existing customer, auto-create VIP subscription
    if (isExistingCustomer) {
      try {
        sqlJsDb.run(
          "INSERT INTO subscriptions (user_id, plan, status) VALUES (?, 'vip', 'active')",
          [userId]
        );
        await saveDb();
        console.log(`[register] VIP subscription created for user ${userId} (${email})`);
      } catch (subErr: any) {
        console.error("[register] Failed to create VIP subscription:", subErr?.message ?? subErr);
      }
    }

    // Generate JWT
    // (Use the shared signer so we don't accidentally create non-standard tokens)
    const token = await signJWT({
      userId: Number(userId),
      email: String(email),
      isAdmin: !!isAdmin,
    });

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
