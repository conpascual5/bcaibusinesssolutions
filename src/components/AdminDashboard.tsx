import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  UserCheck,
  UserX,
  Sparkles,
  Crown,
  Star,
  TrendingUp,
  Activity,
  RefreshCw,
  Package,
} from "lucide-react";

type DashboardStats = {
  total: number;
  active: number;
  inactive: number;
  free: number;
  pro: number;
  vip: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (showLoader: boolean) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("profiles")
        .select("is_active, plan");

      if (err) {
        setError(err.message);
        return;
      }

      const rows = (data ?? []) as { is_active: boolean; plan: string }[];
      const total = rows.length;
      const active = rows.filter((r) => r.is_active).length;
      const inactive = rows.filter((r) => !r.is_active).length;
      const free = rows.filter((r) => r.plan === "free").length;
      const pro = rows.filter((r) => r.plan === "pro").length;
      const vip = rows.filter((r) => r.plan === "vip").length;

      setStats({ total, active, inactive, free, pro, vip });
    } catch (err: any) {
      setError(err?.message || "Failed to load stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(true);
  }, [fetchStats]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8">
        <div className="text-sm text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Total Users",
      value: stats.total,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      label: "Active",
      value: stats.active,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      icon: UserX,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
    },
    {
      label: "Free",
      value: stats.free,
      icon: Sparkles,
      color: "text-slate-600",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
    {
      label: "Marketing Kit",
      value: stats.pro,
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "VIP",
      value: stats.vip,
      icon: Star,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
            Dashboard Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-refreshes every 15 seconds.
          </p>
        </div>
        <button
          onClick={() => fetchStats(false)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-2xl border ${card.border} ${card.bg} p-4 flex flex-col items-center text-center`}
            >
              <Icon className={`w-6 h-6 ${card.color} mb-2`} />
              <span className="text-2xl font-bold text-foreground">{card.value}</span>
              <span className="text-xs font-medium text-muted-foreground mt-0.5">{card.label}</span>
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Plan Distribution</h3>
        <div className="flex h-4 rounded-full overflow-hidden border border-border">
          {stats.free > 0 && (
            <div
              className="bg-slate-400 transition-all"
              style={{ width: `${(stats.free / stats.total) * 100}%` }}
              title={`Free: ${stats.free}`}
            />
          )}
          {stats.pro > 0 && (
            <div
              className="bg-amber-400 transition-all"
              style={{ width: `${(stats.pro / stats.total) * 100}%` }}
              title={`Marketing Kit: ${stats.pro}`}
            />
          )}
          {stats.vip > 0 && (
            <div
              className="bg-purple-400 transition-all"
              style={{ width: `${(stats.vip / stats.total) * 100}%` }}
              title={`VIP: ${stats.vip}`}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {[
            { label: "Free", count: stats.free, color: "bg-slate-400" },
            { label: "Marketing Kit", count: stats.pro, color: "bg-amber-400" },
            { label: "VIP", count: stats.vip, color: "bg-purple-400" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="font-medium">{item.label}</span>
              <span>({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
