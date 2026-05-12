import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";

type UsageInfo = {
  feature: string;
  used: number;
  limit: number;
  remaining: number;
  isPro: boolean;
  isVip?: boolean;
  plan?: string;
};

type UsageState = {
  loading: boolean;
  error: string | null;
  usage: UsageInfo | null;
  check: () => Promise<UsageInfo | null>;
  increment: () => Promise<{ success: boolean; error?: string; limitReached?: boolean }>;
};

const PLAN_LIMITS = {
  free: 3,
  pro: 500,
  vip: 100,
} as const;

type Plan = keyof typeof PLAN_LIMITS;

export function useUsageLimit(feature: string): UsageState {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const plan: Plan = (user?.plan ?? "free") as Plan;
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const check = useCallback(async () => {
    if (!user?.id || !token) return null;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/usage/${encodeURIComponent(feature)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || json?.message || `Usage check failed (${res.status})`);

      const used = Number(json.used ?? 0);
      const remaining = Number(json.remaining ?? Math.max(0, limit - used));

      const info: UsageInfo = {
        feature,
        used,
        limit: Number(json.limit ?? limit),
        remaining,
        isPro: !!json.isPro,
        isVip: !!json.isVip,
        plan: String(json.plan ?? plan),
      };

      setUsage(info);
      return info;
    } catch (e: any) {
      setError(e?.message || "Failed to check usage");
      return null;
    } finally {
      setLoading(false);
    }
  }, [feature, limit, plan, token, user?.id]);

  const increment = useCallback(async () => {
    if (!user?.id || !token) return { success: false, error: "Not authenticated" };

    const current = usage ?? (await check());
    if (!current) return { success: false, error: "Failed to check usage" };

    if (current.remaining <= 0) {
      return { success: false, limitReached: true, error: "limit_reached" };
    }

    try {
      const res = await fetch(`/api/usage/${encodeURIComponent(feature)}/increment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (json?.error === "limit_reached") {
          return { success: false, limitReached: true, error: "limit_reached" };
        }
        throw new Error(json?.message || json?.error || `Usage increment failed (${res.status})`);
      }

      await check();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to increment usage" };
    }
  }, [check, feature, token, usage, user?.id]);

  useEffect(() => {
    check();
  }, [check]);

  return { loading, error, usage, check, increment };
}
