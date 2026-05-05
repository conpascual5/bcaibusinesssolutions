import { Hono } from "hono";
import { verifyJWT } from "./auth-utils.js";
import { getDbReady } from "./queries/connection.js";
import { users } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

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
    const db = await getDbReady() as any;

    // Get user's plan from local SQLite
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    const plan = user?.plan || "free";

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

    // VIP: 100 uses per month across all features
    const vipLimit = 100;
    if (isVip) {
      // Get total usage across all features for this month from local DB
      const [totalRow] = await db.execute(
        sql`SELECT COALESCE(SUM(count), 0) as total FROM user_usage WHERE user_id = ${payload.userId} AND month = ${month}`
      );
      const totalUsed = Number(totalRow?.total ?? 0);
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
    const [usageRow] = await db.execute(
      sql`SELECT COALESCE(count, 0) as count FROM user_usage WHERE user_id = ${payload.userId} AND feature = ${feature} AND month = ${month}`
    );
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
    const payload = verifyJWT(token);
    if (!payload) return c.json({ error: "Invalid token" }, 401);

    const feature = c.req.param("feature");
    const limit = FREE_LIMITS[feature];
    if (limit === undefined) {
      return c.json({ error: "Unknown feature" }, 400);
    }

    const month = getMonth();
    const db = await getDbReady() as any;

    // Get user's plan from local SQLite
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    const plan = user?.plan || "free";

    const isPro = plan === "pro";
    const isVip = plan === "vip";

    if (isPro) {
      return c.json({ success: true, isPro: true, plan: "pro" });
    }

    // VIP: check total monthly usage across all features
    const vipLimit = 100;
    if (isVip) {
      const [totalRow] = await db.execute(
        sql`SELECT COALESCE(SUM(count), 0) as total FROM user_usage WHERE user_id = ${payload.userId} AND month = ${month}`
      );
      const totalUsed = Number(totalRow?.total ?? 0);

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
      const [existing] = await db.execute(
        sql`SELECT id, count FROM user_usage WHERE user_id = ${payload.userId} AND feature = ${feature} AND month = ${month}`
      );

      if (existing) {
        await db.execute(
          sql`UPDATE user_usage SET count = count + 1, updated_at = datetime('now') WHERE id = ${existing.id}`
        );
      } else {
        await db.execute(
          sql`INSERT INTO user_usage (user_id, feature, month, count) VALUES (${payload.userId}, ${feature}, ${month}, 1)`
        );
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
    const [existing] = await db.execute(
      sql`SELECT id, count FROM user_usage WHERE user_id = ${payload.userId} AND feature = ${feature} AND month = ${month}`
    );
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
      await db.execute(
        sql`UPDATE user_usage SET count = count + 1, updated_at = datetime('now') WHERE id = ${existing.id}`
      );
    } else {
      await db.execute(
        sql`INSERT INTO user_usage (user_id, feature, month, count) VALUES (${payload.userId}, ${feature}, ${month}, 1)`
      );
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
