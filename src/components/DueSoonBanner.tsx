import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CalendarClock, Loader2, X, DollarSign } from "lucide-react";

type DueSubscription = {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  next_billing_date: string;
  user_name: string | null;
  user_email: string | null;
};

export default function DueSoonBanner() {
  const [dueSubs, setDueSubs] = useState<DueSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id, user_id, plan, amount, next_billing_date")
        .eq("status", "active")
        .eq("suspended", false)
        .gte("next_billing_date", today.toISOString().split("T")[0])
        .lte("next_billing_date", threeDaysFromNow.toISOString().split("T")[0]);

      if (!subs || subs.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch user names
      const userIds = subs.map((s: any) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
      (profiles || []).forEach((p: any) => {
        profileMap[p.id] = { full_name: p.full_name, email: p.email };
      });

      const planLabels: Record<string, string> = {
        bms: "BMS",
        hr: "HR Access",
        gcash: "GCash Access",
        pro: "Marketing Kit",
        vip: "VIP",
      };

      const result: DueSubscription[] = (subs as any[]).map((s) => ({
        ...s,
        user_name: profileMap[s.user_id]?.full_name || null,
        user_email: profileMap[s.user_id]?.email || null,
        plan: planLabels[s.plan] || s.plan,
      }));

      setDueSubs(result);
      setLoading(false);
    })();
  }, []);

  if (loading || dismissed || dueSubs.length === 0) return null;

  const totalDue = dueSubs.reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-800/40 shrink-0">
          <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              <AlertTriangle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              {dueSubs.length} subscription{dueSubs.length > 1 ? "s" : ""} due within 3 days
            </h4>
            <span className="text-xs font-semibold bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
              ₱{totalDue.toLocaleString()} total
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {dueSubs.map((s) => {
              const daysLeft = Math.ceil(
                (new Date(s.next_billing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-2 bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-1.5 text-xs"
                >
                  <DollarSign className="w-3 h-3 text-amber-500" />
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    {s.user_name || s.user_email || "Unknown"}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">•</span>
                  <span className="font-medium text-amber-700 dark:text-amber-300">{s.plan}</span>
                  <span className="text-amber-600 dark:text-amber-400">•</span>
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    ₱{Number(s.amount).toLocaleString()}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">•</span>
                  <span className={`font-semibold ${daysLeft <= 0 ? "text-red-600" : "text-amber-600"}`}>
                    {daysLeft <= 0 ? "Due today!" : `${daysLeft}d left`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
