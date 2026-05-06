import { Hono } from "hono";
import { getSupabaseClient } from "./queries/supabase-client.js";

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

async function getUserFromToken(token: string) {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function getUserPlan(userId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data } = await (supabase as any)
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();
  return data?.plan ?? "free";
}

// Check if user has remaining usage for a feature
app.get("/api/usage/:feature", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const supaUser = await getUserFromToken(token);
    if (!supaUser) return c.json({ error: "Invalid token" }, 401);

    const feature = c.req.param("feature");
    const limit = FREE_LIMITS[feature];
    if (limit === undefined) {
      return c.json({ error: "Unknown feature" }, 400);
    }

    const month = getMonth();
    const plan = await getUserPlan(supaUser.id);
    const isPro = plan === "pro";
    const isVip = plan === "vip";

    if (isPro) {
      return c.json({
        feature,
        used: 0,
        limit: -1,
        remaining: 999,
        isPro: true,
        plan: "pro",
      });
    }

    const supabase = getSupabaseClient();

    // VIP: 100 uses per month across all features
    const vipLimit = 100;
    if (isVip) {
      const { data: totalRows } = await (supabase as any)
        .from("user_usage")
        .select("count")
        .eq("user_id", supaUser.id)
        .eq("month", month);

      const totalUsed = (totalRows ?? []).reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);
      const remaining = Math.max(0, vipLimit - totalUsed);

      return c.json({
        feature,
        used: totalUsed,
        limit: vipLimit,
        remaining,
        isPro: false,
        isVip: true,
        plan: "vip",
      });
    }

    // Free: get current usage count for this feature
    const { data: usageRow } = await (supabase as any)
      .from("user_usage")
      .select("count")
      .eq("user_id", supaUser.id)
      .eq("feature", feature)
      .eq("month", month)
      .single();

    const used = Number(usageRow?.count ?? 0);
    const remaining = Math.max(0, limit - used);

    return c.json({
      feature,
      used,
      limit,
      remaining,
      isPro: false,
      isVip: false,
      plan: "free",
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
    const supaUser = await getUserFromToken(token);
    if (!supaUser) return c.json({ error: "Invalid token" }, 401);

    const feature = c.req.param("feature");
    const limit = FREE_LIMITS[feature];
    if (limit === undefined) {
      return c.json({ error: "Unknown feature" }, 400);
    }

    const month = getMonth();
    const plan = await getUserPlan(supaUser.id);
    const isPro = plan === "pro";
    const isVip = plan === "vip";

    if (isPro) {
      return c.json({ success: true, isPro: true, plan: "pro" });
    }

    const supabase = getSupabaseClient();

    // VIP: check total monthly usage across all features
    const vipLimit = 100;
    if (isVip) {
      const { data: totalRows } = await (supabase as any)
        .from("user_usage")
        .select("count")
        .eq("user_id", supaUser.id)
        .eq("month", month);

      const totalUsed = (totalRows ?? []).reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);

      if (totalUsed >= vipLimit) {
        return c.json({
          error: "limit_reached",
          message: `You've reached your VIP monthly limit of ${vipLimit} uses. Please wait until next month.`,
          feature,
          limit: vipLimit,
          used: totalUsed,
        }, 403);
      }

      // Upsert usage
      const { data: existing } = await (supabase as any)
        .from("user_usage")
        .select("id, count")
        .eq("user_id", supaUser.id)
        .eq("feature", feature)
        .eq("month", month)
        .single();

      if (existing) {
        await (supabase as any)
          .from("user_usage")
          .update({ count: (existing.count ?? 0) + 1, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await (supabase as any)
          .from("user_usage")
          .insert({ user_id: supaUser.id, feature, month, count: 1 });
      }

      return c.json({
        success: true,
        feature,
        used: totalUsed + 1,
        remaining: vipLimit - (totalUsed + 1),
        isPro: false,
        isVip: true,
        plan: "vip",
      });
    }

    // Free: check current usage
    const { data: existing } = await (supabase as any)
      .from("user_usage")
      .select("id, count")
      .eq("user_id", supaUser.id)
      .eq("feature", feature)
      .eq("month", month)
      .single();

    const used = Number(existing?.count ?? 0);

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
    if (existing) {
      await (supabase as any)
        .from("user_usage")
        .update({ count: (existing.count ?? 0) + 1, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await (supabase as any)
        .from("user_usage")
        .insert({ user_id: supaUser.id, feature, month, count: 1 });
    }

    return c.json({
      success: true,
      feature,
      used: used + 1,
      remaining: limit - (used + 1),
      isPro: false,
      isVip: false,
      plan: "free",
    });
  } catch (err: any) {
    console.error("[usage] Increment error:", err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
