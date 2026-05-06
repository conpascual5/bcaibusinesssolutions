import { Hono } from "hono";

const debugUsersApp = new Hono();

debugUsersApp.get("/api/debug/users", async (c) => {
  try {
    const { getSupabaseClient } = await import("./queries/supabase-client.ts");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, is_admin, is_active, plan, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ count: data?.length ?? 0, users: data ?? [] });
  } catch (err: any) {
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
});

export default debugUsersApp;
