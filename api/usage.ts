import { Hono } from "hono";
import { getSupabaseClient } from "./queries/supabase-client.js";

const app = new Hono();

// Per-plan generation limits (across all features)
const PLAN_LIMITS: Record<string, number> = {
  free: 3, // one-time trial
  pro: 500,
  vip: 100,
};

// Get current month as YYYY-MM
function getMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function getUserFromToken(token: string) {
  const supabase = getSupabaseClient(token);
  const { data: { user }, error } = await (supabase as any).auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function getUserPlan(userId: string, token: string): Promise<string> {
  const supabase = getSupabaseClient(token);
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

    const month = getMonth();
    const plan = await getUserPlan(supaUser.id, token);
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    const supabase = getSupabaseClient(token);

    // Count total usage for this month across all features (aggregate for speed)
    const { data: agg, error: aggErr } = await (supabase as any)
      .from("user_usage")
      .select("count:count.sum()")
      .eq("user_id", supaUser.id)
      .eq("month", month)
      .maybeSingle();

    if (aggErr) {
      console.error("[usage] aggregate error:", aggErr.message);
    }

    const used = Number((agg as any)?.count ?? 0);

    // Free is a one-time trial: after 3 total generations ever, block.
    // Use a lightweight aggregate query to avoid pulling all rows (helps Vercel cold starts).
    if (plan === "free") {
      const { data: agg, error: aggErr } = await (supabase as any)
        .from("user_usage")
        .select("count:count.sum()")
        .eq("user_id", supaUser.id)
        .maybeSingle();

      if (aggErr) {
        console.error("[usage] aggregate error:", aggErr.message);
      }

      const totalEverUsed = Number((agg as any)?.count ?? 0);

      return c.json({
        feature,
        used: totalEverUsed,
        limit,
        remaining: Math.max(0, limit - totalEverUsed),
        isPro: false,
        isVip: false,
        plan: "free",
      });
    }

    return c.json({
      feature,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      isPro: plan === "pro",
      isVip: plan === "vip",
      plan,
    });
  } catch (err: any) {
    console.error("[usage] Error:", err);
    return c.json({ error: err.message }, 500);
  }
});

async function upsertUsage(opts: { supabase: any; userId: string; feature: string; month: string }) {
  const { supabase, userId, feature, month } = opts;

  const { data: existing } = await (supabase as any)
    .from("user_usage")
    .select("id, count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("month", month)
    .single();

  if (existing) {
    await (supabase as any)
      .from("user_usage")
      .update({ count: Number(existing.count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await (supabase as any)
      .from("user_usage")
      .insert({ user_id: userId, feature, month, count: 1 });
  }
}

// Increment usage count for a feature
app.post("/api/usage/:feature/increment", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const supaUser = await getUserFromToken(token);
    if (!supaUser) return c.json({ error: "Invalid token" }, 401);

    const feature = c.req.param("feature");

    const month = getMonth();
    const plan = await getUserPlan(supaUser.id, token);
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    const supabase = getSupabaseClient(token);

    // Free is a one-time trial: max 3 total generations ever.
    if (plan === "free") {
      const { data: allRows } = await (supabase as any)
        .from("user_usage")
        .select("count")
        .eq("user_id", supaUser.id);
      const totalEverUsed = (allRows ?? []).reduce((sum: number, r: any) => sum + Number(r.count ?? 0), 0);

      if (totalEverUsed >= limit) {
        return c.json({
          error: "limit_reached",
          message: `Free trial used up (${limit} generations total). Upgrade to Pro to get ${PLAN_LIMITS.pro} generations.`,
          feature,
          limit,
          used: totalEverUsed,
        }, 403);
      }

      await upsertUsage({ supabase, userId: supaUser.id, feature, month });
      const nextUsed = totalEverUsed + 1;

      return c.json({
        success: true,
        feature,
        used: nextUsed,
        remaining: Math.max(0, limit - nextUsed),
        isPro: false,
        isVip: false,
        plan: "free",
      });
    }

    // Pro / VIP: monthly cap across all features (aggregate for speed)
    const { data: agg, error: aggErr } = await (supabase as any)
      .from("user_usage")
      .select("count:count.sum()")
      .eq("user_id", supaUser.id)
      .eq("month", month)
      .maybeSingle();

    if (aggErr) {
      console.error("[usage] aggregate error:", aggErr.message);
    }

    const totalUsedThisMonth = Number((agg as any)?.count ?? 0);

    if (totalUsedThisMonth >= limit) {
      return c.json({
        error: "limit_reached",
        message: `You've reached your ${plan.toUpperCase()} limit of ${limit} generations this month.`,
        feature,
        limit,
        used: totalUsedThisMonth,
      }, 403);
    }

    await upsertUsage({ supabase, userId: supaUser.id, feature, month });

    return c.json({
      success: true,
      feature,
      used: totalUsedThisMonth + 1,
      remaining: Math.max(0, limit - (totalUsedThisMonth + 1)),
      isPro: plan === "pro",
      isVip: plan === "vip",
      plan,
    });
  } catch (err: any) {
    console.error("[usage] Increment error:", err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
