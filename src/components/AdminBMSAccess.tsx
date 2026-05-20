import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X, Search, Building2, Shield, UserCheck, Pause, Play } from "lucide-react";
import { toast } from "sonner";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
};

type BusinessAccessRow = {
  user_id: string;
  created_at: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  amount: number;
  suspended: boolean;
  next_billing_date: string;
};

export default function AdminBMSAccess() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>({});
  const [subscriptions, setSubscriptions] = useState<Record<string, SubscriptionRow>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [usersRes, accessRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, is_admin").order("created_at", { ascending: false }),
        supabase.from("user_business_access").select("user_id, created_at"),
        supabase.from("subscriptions").select("*").eq("plan", "bms").eq("status", "active"),
      ]);

      if (usersRes.data) {
        setUsers(usersRes.data as unknown as ProfileRow[]);
      }
      if (accessRes.data) {
        const map: Record<string, boolean> = {};
        (accessRes.data as unknown as BusinessAccessRow[]).forEach((a) => {
          map[a.user_id] = true;
        });
        setAccessMap(map);
      }
      if (subsRes.data) {
        const subMap: Record<string, SubscriptionRow> = {};
        (subsRes.data as SubscriptionRow[]).forEach((s) => {
          subMap[s.user_id] = s;
        });
        setSubscriptions(subMap);
      }
      setLoading(false);
    })();
  }, []);

  const toggleAccess = async (userId: string, hasAccess: boolean) => {
    setToggling(userId);
    try {
      if (hasAccess) {
        await supabase.from("user_business_access").delete().eq("user_id", userId);
        await supabase.from("subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("user_id", userId).eq("plan", "bms").eq("status", "active");
        setAccessMap((prev) => ({ ...prev, [userId]: false }));
        setSubscriptions((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      } else {
        await supabase.from("user_business_access").insert({ user_id: userId, granted_by: (await supabase.auth.getUser()).data.user?.id });
        await supabase.rpc("create_subscription_with_invoice", {
          p_user_id: userId,
          p_plan: "bms",
          p_amount: 999,
        });
        // Create business_seats record if not exists
        const { data: existingSeats } = await supabase.from("business_seats").select("id").eq("business_id", userId).maybeSingle();
        if (!existingSeats) {
          await supabase.from("business_seats").insert({ business_id: userId, seat_limit: 10, additional_seat_price: 69 });
        }
        setAccessMap((prev) => ({ ...prev, [userId]: true }));
        // Refresh subscriptions
        const { data } = await supabase.from("subscriptions").select("*").eq("user_id", userId).eq("plan", "bms").eq("status", "active").maybeSingle();
        if (data) {
          setSubscriptions((prev) => ({ ...prev, [userId]: data as SubscriptionRow }));
        }
        toast.success("BMS access granted. ₱999/month subscription created.");
      }
    } catch (err) {
      console.error("Failed to toggle access", err);
      toast.error("Failed to toggle access");
    }
    setToggling(null);
  };

  const toggleSuspend = async (userId: string, sub: SubscriptionRow) => {
    setSuspending(userId);
    try {
      const newSuspended = !sub.suspended;
      await supabase.from("subscriptions").update({ suspended: newSuspended, updated_at: new Date().toISOString() }).eq("id", sub.id);

      // If suspending, also deactivate access. If resuming, keep access.
      if (newSuspended) {
        await supabase.from("user_business_access").delete().eq("user_id", userId);
        setAccessMap((prev) => ({ ...prev, [userId]: false }));
      } else {
        await supabase.from("user_business_access").insert({ user_id: userId, granted_by: (await supabase.auth.getUser()).data.user?.id });
        setAccessMap((prev) => ({ ...prev, [userId]: true }));
      }

      setSubscriptions((prev) => ({
        ...prev,
        [userId]: { ...sub, suspended: newSuspended },
      }));

      toast.success(newSuspended ? "Subscription suspended. Access revoked." : "Subscription resumed. Access restored.");
    } catch (err) {
      console.error("Failed to toggle suspension", err);
      toast.error("Failed to update subscription");
    }
    setSuspending(null);
  };

  const filteredUsers = users.filter((u) => {
    if (u.is_admin) return false;
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            Business Management Access
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Grant or revoke BMS access. ₱999/month — creates subscription with invoices.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Access</th>
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Subscription</th>
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Billing</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => {
                const hasAccess = !!accessMap[u.id];
                const sub = subscriptions[u.id];
                const isSuspended = sub?.suspended ?? false;
                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-sm">{u.full_name || "Unnamed"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{u.email || "—"}</td>
                    <td className="px-5 py-4 text-center">
                      {hasAccess ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
                          <Check className="w-3 h-3" /> Granted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded-full text-xs font-bold">
                          <X className="w-3 h-3" /> None
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {sub ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isSuspended
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        }`}>
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-muted-foreground">
                      {sub ? new Date(sub.next_billing_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sub && (
                          <button
                            onClick={() => toggleSuspend(u.id, sub)}
                            disabled={suspending === u.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isSuspended
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                            } disabled:opacity-50`}
                          >
                            {suspending === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isSuspended ? (
                              <><Play className="w-3.5 h-3.5" /> Resume</>
                            ) : (
                              <><Pause className="w-3.5 h-3.5" /> Suspend</>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => toggleAccess(u.id, hasAccess)}
                          disabled={toggling === u.id}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            hasAccess
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                              : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                          } disabled:opacity-50`}
                        >
                          {toggling === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : hasAccess ? (
                            <><X className="w-4 h-4" /> Revoke</>
                          ) : (
                            <><UserCheck className="w-4 h-4" /> Grant</>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Shield className="w-3.5 h-3.5" />
        <span>Only non-admin users are shown. ₱999/month — Suspend stops access but keeps subscription record.</span>
      </div>
    </div>
  );
}
