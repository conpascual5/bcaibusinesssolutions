// Standalone login endpoint — uses Supabase Auth
import { Hono } from "hono";

const loginApp = new Hono();

loginApp.post("/api/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password required" }, 400);
    }

    const { getSupabaseClient } = await import("./queries/supabase-client.js");
    const supabase = getSupabaseClient();

    const { data, error } = await (supabase as any).auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[login] Supabase auth error:", error.message);
      return c.json({ error: "Invalid credentials" }, 401);
    }

    if (!data.user || !data.session) {
      return c.json({ error: "Login failed" }, 500);
    }

    // Get profile info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_admin, is_active")
      .eq("id", data.user.id)
      .single();

    if (profile && !profile.is_active) {
      return c.json({ error: "Account deactivated" }, 403);
    }

    return c.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.full_name ?? data.user.email?.split("@")[0] ?? "User",
        isAdmin: !!profile?.is_admin,
      },
    });
  } catch (err: any) {
    console.error("[login] Error:", err?.message ?? err);
    return c.json({ error: err?.message || "Login failed" }, 500);
  }
});

export default loginApp;
