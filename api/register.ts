// Standalone register endpoint — uses Supabase Auth
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

    const { getSupabaseClient } = await import("./queries/supabase-client.js");
    const supabase = getSupabaseClient();

    // Sign up with Supabase Auth
    const { data, error } = await (supabase as any).auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      console.error("[register] Supabase auth error:", error.message);
      if (error.message.includes("already")) {
        return c.json({ error: "Email already registered" }, 409);
      }
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      return c.json({ error: "Registration failed" }, 500);
    }

    // The trigger handle_new_user() should have created the profile.
    // If not (e.g. email confirmation is on), create it manually.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .single();

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        full_name: name,
        is_active: true,
        is_admin: false,
        plan: "free",
      });
    }

    // If existing customer, update plan to VIP
    if (isExistingCustomer) {
      await supabase
        .from("profiles")
        .update({ plan: "vip" })
        .eq("id", data.user.id);
      console.log(`[register] VIP plan set for user ${data.user.id} (${email})`);
    }

    // If email confirmation is required, tell the user
    if (!data.session) {
      return c.json({
        message: "Registration successful! Please check your email to confirm your account.",
        requiresConfirmation: true,
      });
    }

    return c.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name,
        isAdmin: false,
      },
    });
  } catch (err: any) {
    console.error("[register] Error:", err?.message ?? err);
    return c.json({ error: err?.message || "Registration failed" }, 500);
  }
});

export default registerApp;
