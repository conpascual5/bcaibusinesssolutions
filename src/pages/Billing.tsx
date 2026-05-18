import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth";
import { formatCurrency } from "@/lib/currency";
import { Loader2, FileText, Calendar, CreditCard, Download, CheckCircle, AlertCircle, Clock } from "lucide-react";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  amount: number;
  billing_date: string;
  next_billing_date: string;
  billing_cycle: string;
  created_at: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  plan: string;
  amount: number;
  period_start: string;
  period_end: string;
  status: string;
  paid_at: string | null;
  created_at: string;
};

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  pro_plus: "Pro Plus",
  vip: "VIP",
  gcash: "GCash Access",
  bms: "Business Management",
};

const PLAN_COLORS: Record<string, string> = {
  pro: "bg-amber-100 text-amber-700 border-amber-200",
  pro_plus: "bg-rose-100 text-rose-700 border-rose-200",
  vip: "bg-purple-100 text-purple-700 border-purple-200",
  gcash: "bg-emerald-100 text-emerald-700 border-emerald-200",
  bms: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500", icon: AlertCircle },
};

export default function Billing() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const isAdminView = !!userIdParam && user?.isAdmin;
  const targetUserId = userIdParam || user?.id;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<{ full_name: string; email: string } | null>(null);

  useEffect(() => {
    if (!targetUserId) return;
    (async () => {
      setLoading(true);

      // Fetch user info if admin view
      if (isAdminView) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", targetUserId)
          .maybeSingle();
        if (data) setTargetUser(data as any);
      }

      // Fetch active subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", targetUserId)
        .eq("status", "active")
        .maybeSingle();
      setSubscription(sub as Subscription | null);

      // Fetch invoices
      const { data: invs } = await supabase
        .from("subscription_invoices")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });
      setInvoices((invs as Invoice[]) || []);

      setLoading(false);
    })();
  }, [targetUserId, isAdminView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-indigo-500" />
          Billing & Invoices
        </h1>
        {isAdminView && targetUser && (
          <p className="text-sm text-muted-foreground mt-1">
            Viewing billing for <span className="font-medium text-foreground">{targetUser.full_name || targetUser.email}</span>
          </p>
        )}
      </div>

      {/* Active Subscription */}
      {subscription ? (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Subscription</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${PLAN_COLORS[subscription.plan] || "bg-gray-100 text-gray-700"}`}>
              {PLAN_LABELS[subscription.plan] || subscription.plan}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-lg font-bold">{formatCurrency(subscription.amount)}</p>
              <p className="text-xs text-muted-foreground">/{subscription.billing_cycle}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Billing Date</p>
              <p className="text-lg font-bold">{new Date(subscription.billing_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Next Billing</p>
              <p className="text-lg font-bold text-indigo-600">{new Date(subscription.next_billing_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold mt-1">
                <CheckCircle className="w-3 h-3" />
                Active
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-1">No Active Subscription</h3>
          <p className="text-sm text-muted-foreground">This user doesn't have an active subscription yet.</p>
        </div>
      )}

      {/* Invoices */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            Invoices
          </h2>
          <span className="text-xs text-muted-foreground">{invoices.length} total</span>
        </div>

        {invoices.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No invoices yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice #</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="text-center px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => {
                  const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium">{inv.invoice_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${PLAN_COLORS[inv.plan] || "bg-gray-100 text-gray-700"}`}>
                          {PLAN_LABELS[inv.plan] || inv.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(inv.period_start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        {" — "}
                        {new Date(inv.period_end).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
