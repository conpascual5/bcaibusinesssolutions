import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/auth";

type UsageInfo = {
  feature: string;
  used: number;
  limit: number;
  remaining: number;
  isPro: boolean;
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

export function useUsageLimit(feature: string): UsageState {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const check = useCallback(async () => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/usage/${feature}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to check usage");
      }
      const data = await res.json();
      setUsage(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [feature, token]);

  const increment = useCallback(async () => {
    if (!token) return { success: false, error: "Not authenticated" };
    try {
      const res = await fetch(`/api/usage/${feature}/increment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "limit_reached") {
          return { success: false, limitReached: true, error: data.message };
        }
        return { success: false, error: data.error || "Failed to increment usage" };
      }

      setUsage(data);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [feature, token]);

  useEffect(() => {
    check();
  }, [check]);

  return { loading, error, usage, check, increment };
}

// Helper to get the display name
export function getFeatureName(feature: string): string {
  return FEATURE_NAMES[feature] || feature.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Free limits display info
export const FREE_LIMITS: Record<string, number> = {
  "image-ad-analyzer": 5,
  "sales-wizard": 3,
  "fb-ads-targeting": 5,
  "captions-video-script": 5,
  "ad-analyzer": 3,
  "invoices": 3,
};
