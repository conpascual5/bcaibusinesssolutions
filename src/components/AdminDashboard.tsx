import { useEffect, useState } from "react";
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
} from "lucide-react";

type DashboardStats = {
  total: number;
  active: number;
  inactive: number;
  free: number;
  pro: number;
  pro_plus: number;
  vip: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
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
        const pro_plus = rows.filter((r) => r.plan === "pro_plus").length;
        const vip = rows.filter((r) => r.plan === "vip").length;

        setStats({ total, active, inactive, free, pro, pro_plus, vip });
      } catch (err: any) {
        setError(err?.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8">
        <div className="text-sm text-muted-foreground">Loading dashboard…</div>
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
      label: "Pro",
      value: stats.pro,
      icon: Crown,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "Pro Plus",
      value: stats.pro_plus,
      icon: TrendingUp,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
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
            Real-time snapshot of all registered users.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
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
              title={`Pro: ${stats.pro}`}
            />
          )}
          {stats.pro_plus > 0 && (
            <div
              className="bg-rose-400 transition-all"
              style={{ width: `${(stats.pro_plus / stats.total) * 100}%` }}
              title={`Pro Plus: ${stats.pro_plus}`}
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
            { label: "Pro", count: stats.pro, color: "bg-amber-400" },
            { label: "Pro Plus", count: stats.pro_plus, color: "bg-rose-400" },
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
