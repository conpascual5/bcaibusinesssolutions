import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/auth";
import { supabase } from "@/integrations/supabase/client";

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

const FEATURE_NAMES: Record<string, string> = {
  "image-ad-analyzer": "Image Ad Analyzer",
  "sales-wizard": "Sales Wizard",
  "fb-ads-targeting": "FB Ads Targeting",
  "captions-video-script": "Captions & Video Script",
  "ad-analyzer": "Ad Analyzer",
  "invoices": "Invoices",
};

const PLAN_LIMITS = {
  free: 3,
  pro: 500,
  vip: 100,
} as const;

type Plan = keyof typeof PLAN_LIMITS;

type Row = {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  used: number;
  updated_at: string;
};

function monthBounds(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useUsageLimit(feature: string): UsageState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const plan: Plan = (user?.plan ?? "free") as Plan;
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const check = useCallback(async () => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);

    try {
      const { start, end } = monthBounds();

      const { data, error: qErr } = await supabase
        .from("usage_monthly")
        .select("id,user_id,period_start,period_end,used,updated_at")
        .eq("user_id", user.id)
        .eq("period_start", start)
        .eq("period_end", end)
        .maybeSingle();

      if (qErr) throw qErr;

      const used = (data as Row | null)?.used ?? 0;

      const info: UsageInfo = {
        feature,
        used,
        limit,
        remaining: Math.max(0, limit - used),
        isPro: plan === "pro",
        isVip: plan === "vip",
        plan,
      };

      setUsage(info);
      return info;
    } catch (e: any) {
      setError(e?.message || "Failed to check usage");
      return null;
    } finally {
      setLoading(false);
    }
  }, [feature, limit, plan, user?.id]);

  const increment = useCallback(async () => {
    if (!user?.id) return { success: false, error: "Not authenticated" };

    const current = usage ?? (await check());
    if (!current) return { success: false, error: "Failed to check usage" };

    if (current.remaining <= 0) {
      return { success: false, limitReached: true, error: "limit_reached" };
    }

    try {
      const { start, end } = monthBounds();

      // Upsert the row then increment. We do this in two steps to avoid requiring a custom RPC.
      const { data: existing, error: existingErr } = await supabase
        .from("usage_monthly")
        .select("id,used")
        .eq("user_id", user.id)
        .eq("period_start", start)
        .eq("period_end", end)
        .maybeSingle();

      if (existingErr) throw existingErr;

      if (!existing) {
        const { error: insErr } = await supabase
          .from("usage_monthly")
          .insert({
            user_id: user.id,
            period_start: start,
            period_end: end,
            used: 1,
            updated_at: new Date().toISOString(),
          } as any);
        if (insErr) throw insErr;
      } else {
        const { error: updErr } = await supabase
          .from("usage_monthly")
          .update({ used: (existing as any).used + 1, updated_at: new Date().toISOString() } as any)
          .eq("id", (existing as any).id);
        if (updErr) throw updErr;
      }

      await check();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to increment usage" };
    }
  }, [check, usage, user?.id]);

  useEffect(() => {
    check();
  }, [check]);

  return { loading, error, usage, check, increment };
}

export function getFeatureName(feature: string): string {
  return FEATURE_NAMES[feature] || feature.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
