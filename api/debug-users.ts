import { Hono } from "hono";

const debugUsersApp = new Hono();

debugUsersApp.get("/api/debug/users", async (c) => {
  try {
    const { getDbReady, getRawDb } = await import("./queries/connection.js");
    await getDbReady();
    const raw = await getRawDb();
    if (!raw) return c.json({ error: "Database not initialized" }, 500);

    const users: any[] = [];
    const stmt = raw.prepare(
      "SELECT id, email, name, is_admin, is_active, plan, created_at FROM users ORDER BY id DESC LIMIT 50"
    );
    while (stmt.step()) {
      users.push(stmt.getAsObject());
    }
    stmt.free();

    return c.json({ count: users.length, users });
  } catch (err: any) {
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
});

export default debugUsersApp;
