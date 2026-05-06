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
    const { getDbReady, getRawDb } = await import("./queries/connection.js");
    const { verifyPassword } = await import("./auth-utils.js");
    
    console.log("[login] Starting login for:", email);
    await getDbReady();
    console.log("[login] getDbReady completed");

    // Get the raw SQL.js database for direct queries
    const sqlJsDb = await getRawDb();
    console.log("[login] getRawDb returned:", !!sqlJsDb);
    if (!sqlJsDb) {
      return c.json({ error: "Database not initialized" }, 500);
    }

    // Query using SQL.js prepare API
    const stmt = sqlJsDb.prepare(
      "SELECT id, email, name, password_hash, is_active, is_admin FROM users WHERE email = ?"
    );
    stmt.bind([email]);
    let user: any = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }
    if (!user.is_active) {
      return c.json({ error: "Account deactivated" }, 403);
    }

    // Use verifyPassword which has fallback logic for different hash formats
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Generate JWT
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = {
      userId: user.id,
      email: user.email,
      isAdmin: !!user.is_admin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    };
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = Buffer.from(env.jwtSecret).toString("base64url");
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
