import { Hono } from "hono";
import { verifyJWT } from "./auth-utils.js";

const app = new Hono();

// Feature limits for free users
const FREE_LIMITS: Record<string, number> = {
  "image-ad-analyzer": 5,
  "sales-wizard": 3,
  "fb-ads-targeting": 5,
  "captions-video-script": 5,
  "ad-analyzer": 3,
  "invoices": 3,
};

// Get current month as YYYY-MM
function getMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Check if user has remaining usage for a feature
app.get("/api/usage/:feature", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyJWT(token);
    if (!payload) return c.json({ error: "Invalid token" }, 401);

    const feature = c.req.param("feature");
    const limit = FREE_LIMITS[feature];
    if (limit === undefined) {
      return c.json({ error: "Unknown feature" }, 400);
    }

    const month = getMonth();

    // Check subscription status
    const { getSupabaseClient } = await import("./queries/supabase-client.js");
    const supabase = getSupabaseClient();

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", payload.userId)
      .maybeSingle();

    const isPro = sub?.plan === "pro" && sub?.status === "active";

    if (isPro) {
      return c.json({
        feature,
        used: 0,
        limit: -1,
        remaining: 999,
        isPro: true,
      });
    }

    // Get current usage count
    const { data: usageRow } = await supabase
      .from("user_usage")
      .select("count")
      .eq("user_id", payload.userId)
      .eq("feature", feature)
      .eq("month", month)
      .maybeSingle();

    const used = usageRow?.count ?? 0;
    const remaining = Math.max(0, limit - used);

    return c.json({
      feature,
      used,
      limit,
      remaining,
      isPro: false,
    });
  } catch (err: any) {
    console.error("[usage] Error:", err);
    return c.json({ error: err.message }, 500);
  }
});

// Increment usage count for a feature
app.post("/api/usage/:feature/increment", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyJWT(token);
    if (!payload) return c.json({ error: "Invalid token" }, 401);

    const feature = c.req.param("feature");
    const limit = FREE_LIMITS[feature];
    if (limit === undefined) {
      return c.json({ error: "Unknown feature" }, 400);
    }

    const month = getMonth();

    const { getSupabaseClient } = await import("./queries/supabase-client.js");
    const supabase = getSupabaseClient();

    // Check subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", payload.userId)
      .maybeSingle();

    const isPro = sub?.plan === "pro" && sub?.status === "active";

    if (isPro) {
      return c.json({ success: true, isPro: true });
    }

    // Check current usage
    const { data: usageRow } = await supabase
      .from("user_usage")
      .select("count, id")
      .eq("user_id", payload.userId)
      .eq("feature", feature)
      .eq("month", month)
      .maybeSingle();

    const used = usageRow?.count ?? 0;

    if (used >= limit) {
      return c.json({
        error: "limit_reached",
        message: `You've reached your free limit of ${limit} ${feature.replace(/-/g, " ")} this month. Upgrade to Pro for unlimited access!`,
        feature,
        limit,
        used,
      }, 403);
    }

    // Increment
    if (usageRow?.id) {
      await supabase
        .from("user_usage")
        .update({ count: used + 1, updated_at: new Date().toISOString() })
        .eq("id", usageRow.id);
    } else {
      await supabase
        .from("user_usage")
        .insert({
          user_id: payload.userId,
          feature,
          month,
          count: 1,
        });
    }

    return c.json({
      success: true,
      feature,
      used: used + 1,
      remaining: limit - (used + 1),
      isPro: false,
    });
  } catch (err: any) {
    console.error("[usage] Increment error:", err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
