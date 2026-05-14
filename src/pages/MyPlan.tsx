import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth';
import { Crown, Star, Sparkles, Shield, CheckCircle, XCircle, BarChart3, RefreshCw } from 'lucide-react';

const PLAN_INFO = {
  free: {
    label: 'Free',
    icon: Sparkles,
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
  },
  pro: {
    label: 'Pro',
    icon: Crown,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
  },
  pro_plus: {
    label: 'Pro Plus',
    icon: Crown,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
  },
  vip: {
    label: 'VIP',
    icon: Star,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
  },
};

const FEATURES = [
  { key: 'image-ad-analyzer', label: 'Image Ad Analyzer' },
  { key: 'sales-wizard', label: 'Sales Wizard' },
  { key: 'fb-ads-targeting', label: 'FB Ads Targeting' },
  { key: 'captions-video-script', label: 'Captions & Video Script' },
  { key: 'ad-analyzer', label: 'Ad Analyzer' },
  { key: 'invoices', label: 'Invoices' },
];

type UsageRow = {
  used: number;
  limit: number;
  remaining: number;
  isPro: boolean;
  isVip: boolean;
  plan: string;
};

export default function MyPlan() {
  const { user, token } = useAuth();
  const [usageData, setUsageData] = useState<Record<string, UsageRow>>({});
  const [loading, setLoading] = useState(true);

  const plan = ((user?.plan || 'free') as keyof typeof PLAN_INFO);
  const planInfo = PLAN_INFO[plan];
  const PlanIcon = planInfo.icon;

  useEffect(() => {
    async function fetchUsage() {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const results: Record<string, UsageRow> = {};
        await Promise.all(
          FEATURES.map(async (feat) => {
            const res = await fetch(`/api/usage/${encodeURIComponent(feat.key)}`, {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return;
            results[feat.key] = {
              used: Number(json.used ?? 0),
              limit: Number(json.limit ?? 0),
              remaining: Number(json.remaining ?? 0),
              isPro: !!json.isPro,
              isVip: !!json.isVip,
              plan: String(json.plan ?? 'free'),
            };
          })
        );
        setUsageData(results);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, [token]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Plan Card */}
      <div className={`rounded-2xl border ${planInfo.border} ${planInfo.bg} p-6 card-shadow`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <PlanIcon className={`w-6 h-6 ${planInfo.color}`} />
              <h2 className="text-xl font-bold text-foreground">{planInfo.label} Plan</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {plan === 'vip'
                ? 'VIP access — 100 generations per month across all tools'
                : plan === 'pro'
                ? 'Pro access — 500 generations per month across all tools + 30 product images'
                : plan === 'pro_plus'
                ? 'Pro Plus access — 500 generations per month + 30 product images + 1 UGC/Cinematic ad'
                : 'Free trial — 3 total generations (one-time)'}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${planInfo.bg} ${planInfo.color} border ${planInfo.border}`}>
            <PlanIcon className="w-3.5 h-3.5" />
            {planInfo.label}
          </span>
        </div>
      </div>

      {/* Usage Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
            Usage (this month)
          </h3>
          {loading && <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />}
        </div>

        <div className="grid gap-3">
          {FEATURES.map((feat) => {
            const usage = usageData[feat.key];
            const isPro = usage?.isPro ?? plan === 'pro';
            const isVip = usage?.isVip ?? plan === 'vip';
            const used = usage?.used ?? 0;
            const limit = usage?.limit ?? (plan === 'pro' || plan === 'pro_plus' ? 500 : plan === 'vip' ? 100 : 3);
            const remaining = usage?.remaining ?? Math.max(0, limit - used);
            const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

            return (
              <div key={feat.key} className="bg-card rounded-xl border border-border p-4 card-shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-medium text-foreground">{feat.label}</span>
                  {isPro || plan === 'pro_plus' ? (
                    <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" />
                      {remaining} / 500 remaining
                    </span>
                  ) : isVip ? (
                    <span className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {remaining} / 100 remaining
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {remaining} / 3 remaining
                    </span>
                  )}
                </div>
                {!isPro && (
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-card rounded-xl border border-border p-4 card-shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3">Account Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="text-foreground font-medium">{user?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground font-medium">{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                user?.isAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'
              }`}
            >
              {user?.isAdmin ? <Shield className="w-3.5 h-3.5" /> : null}
              {user?.isAdmin ? 'Admin' : 'User'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                user?.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
              }`}
            >
              {user?.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {user?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
