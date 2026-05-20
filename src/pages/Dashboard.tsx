import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/providers/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Crown, Star, ArrowRight, Gift, Users,
  DollarSign, Wallet, Copy, CheckCircle2, BarChart3,
  Wand2, Target, FileText, Package, ShoppingCart,
  TrendingUp, Clock, Loader2
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const plan = user?.plan ?? "free";

  const [affiliate, setAffiliate] = useState<any>(null);
  const [affiliateStats, setAffiliateStats] = useState({ referrals: 0, earned: 0, pending: 0 });
  const [loadingAffiliate, setLoadingAffiliate] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("affiliates")
        .select("id, referral_code, pending_balance, total_earned, total_paid_out")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setAffiliate(data);

        const { data: refs } = await supabase
          .from("affiliate_referrals")
          .select("id", { count: "exact" })
          .eq("affiliate_id", data.id);

        const { data: comms } = await supabase
          .from("affiliate_commissions")
          .select("amount, status")
          .eq("affiliate_id", data.id);

        const totalEarned = (comms || []).reduce((s, c) => s + c.amount, 0);
        const pendingTotal = (comms || [])
          .filter(c => c.status === "pending" || c.status === "approved")
          .reduce((s, c) => s + c.amount, 0);

        setAffiliateStats({
          referrals: refs?.length || 0,
          earned: totalEarned,
          pending: pendingTotal,
        });
      }
      setLoadingAffiliate(false);
    })();
  }, [user]);

  const planColors: Record<string, { bg: string; text: string; icon: any; gradient: string; badge: string }> = {
    vip: {
      bg: "from-purple-50 to-indigo-50",
      text: "text-purple-800",
      icon: Star,
      gradient: "from-purple-500 to-indigo-600",
      badge: "bg-purple-100 text-purple-700 border-purple-200",
    },
    pro: {
      bg: "from-amber-50 to-orange-50",
      text: "text-amber-800",
      icon: Package,
      gradient: "from-amber-400 to-orange-500",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
    },
    default: {
      bg: "from-gray-50 to-slate-50",
      text: "text-gray-700",
      icon: Sparkles,
      gradient: "from-gray-400 to-slate-500",
      badge: "bg-gray-100 text-gray-600 border-gray-200",
    },
  };

  const pc = planColors[plan] || planColors.default;
  const PlanIcon = pc.icon;

  const quickActions = [
    {
      icon: Wand2,
      label: "Sales Wizard",
      desc: "Generate AI-powered sales content",
      path: "/app/sales-wizard",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      hover: "hover:border-indigo-200 hover:shadow-indigo-100",
    },
    {
      icon: Target,
      label: "FB Ads Targeting",
      desc: "Find your perfect audience",
      path: "/app/fb-ads-targeting",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      hover: "hover:border-blue-200 hover:shadow-blue-100",
    },
    {
      icon: BarChart3,
      label: "Sales Report",
      desc: "Analyze your sales performance",
      path: "/app/sales-report",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      hover: "hover:border-emerald-200 hover:shadow-emerald-100",
    },
    {
      icon: FileText,
      label: "Invoices",
      desc: "Create & manage invoices",
      path: "/app/invoices",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
      hover: "hover:border-rose-200 hover:shadow-rose-100",
    },
    {
      icon: Package,
      label: "My Assets",
      desc: "View your generated content",
      path: "/app/my-assets",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      hover: "hover:border-amber-200 hover:shadow-amber-100",
    },
    {
      icon: ShoppingCart,
      label: "Tracker Shop",
      desc: "Browse available trackers",
      path: "/app/shop",
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
      hover: "hover:border-violet-200 hover:shadow-violet-100",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${pc.bg} border border-gray-100 shadow-sm p-6 sm:p-8`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-white/30 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${pc.gradient} shadow-lg`}>
                <PlanIcon className="w-5 h-5 text-white" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${pc.badge}`}>
                {plan === "vip" ? "VIP" : plan === "pro" ? "MARKETING KIT" : plan.toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
              Welcome back, {user?.name?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-gray-500 mt-2 max-w-lg text-sm sm:text-base">
              Your AI toolkit is ready. Generate content, analyze ads, and grow your business.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate("/app/my-plan")}
              className="px-4 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-md transition-all flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              My Plan
            </button>
          </div>
        </div>
      </div>

      {/* Affiliate Program Promo Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-xl shadow-indigo-500/20 p-6 sm:p-8">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-white/10 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-white/10 rounded-full" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                Earn Money
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {affiliate
                ? "Your Affiliate Dashboard"
                : "Join the Affiliate Program"}
            </h2>
            <p className="text-indigo-100 mt-2 text-sm sm:text-base max-w-xl">
              {affiliate
                ? "Track your referrals, commissions, and earnings. Share your link and earn 30% recurring commission."
                : <>Earn <strong className="text-white">30% recurring commission</strong> on every subscription you refer. Share your link and start earning!</>}
            </p>

            {/* Affiliate Stats */}
            {affiliate && (
              <div className="flex flex-wrap gap-4 sm:gap-6 mt-4">
                <div>
                  <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Referrals</p>
                  <p className="text-white text-lg font-bold">{affiliateStats.referrals}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Earned</p>
                  <p className="text-white text-lg font-bold">{formatCurrency(affiliateStats.earned)}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Pending</p>
                  <p className="text-white text-lg font-bold">{formatCurrency(affiliateStats.pending)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0">
            {affiliate ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/auth?ref=${affiliate.referral_code}`;
                    navigator.clipboard.writeText(link);
                  }}
                  className="px-5 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl text-white text-sm font-semibold transition-all flex items-center gap-2 border border-white/20"
                >
                  <Copy className="w-4 h-4" />
                  Copy Referral Link
                </button>
                <button
                  onClick={() => navigate("/app/affiliate")}
                  className="px-5 py-3 bg-white hover:bg-indigo-50 rounded-xl text-indigo-700 text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
                >
                  <TrendingUp className="w-4 h-4" />
                  Full Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/app/affiliate")}
                className="px-6 py-3 bg-white hover:bg-indigo-50 rounded-xl text-indigo-700 text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
              >
                <Gift className="w-4 h-4" />
                Join Now — It's Free
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Wand2, label: "AI Tools", value: "6", desc: "Available tools", color: "text-indigo-600", bg: "bg-indigo-50" },
          { icon: Users, label: "Plan", value: plan === "vip" ? "VIP" : plan === "pro" ? "Marketing Kit" : "Free", desc: plan === "free" ? "Upgrade to unlock more" : "Active subscription", color: "text-amber-600", bg: "bg-amber-50" },
          { icon: Gift, label: "Affiliate", value: affiliate ? "Active" : "Join Free", desc: affiliate ? `${affiliateStats.referrals} referrals` : "Earn 30% recurring", color: "text-purple-600", bg: "bg-purple-50" },
          { icon: Clock, label: "Status", value: "Active", desc: "Account in good standing", color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
            </div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{stat.label}</p>
            <p className="text-lg font-extrabold text-gray-900 mt-0.5">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-gray-900">Quick Actions</h2>
          <span className="text-xs text-gray-400">{quickActions.length} tools available</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`group bg-white rounded-2xl border ${action.border} shadow-sm p-5 text-left ${action.hover} hover:shadow-lg hover:-translate-y-0.5 transition-all`}
            >
              <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">{action.label}</h3>
              <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">
                Open <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Admin shortcut */}
      {user?.isAdmin && (
        <button
          onClick={() => navigate("/admin")}
          className="w-full group bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-amber-900">Admin Panel</h3>
              <p className="text-xs text-amber-700/70">Manage users, plans, and API keys</p>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}
    </div>
  );
}
