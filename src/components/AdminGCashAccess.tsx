import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X, Search, Smartphone, Shield, UserCheck } from "lucide-react";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
};

type GcashAccessRow = {
  user_id: string;
  created_at: string;
};

export default function AdminGCashAccess() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [usersRes, accessRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, is_admin").order("created_at", { ascending: false }),
        supabase.from("user_gcash_access").select("user_id, created_at"),
      ]);

      if (usersRes.data) {
        setUsers(usersRes.data as unknown as ProfileRow[]);
      }
      if (accessRes.data) {
        const map: Record<string, boolean> = {};
        (accessRes.data as unknown as GcashAccessRow[]).forEach((a) => {
          map[a.user_id] = true;
        });
        setAccessMap(map);
      }
      setLoading(false);
    })();
  }, []);

  const toggleAccess = async (userId: string, hasAccess: boolean) => {
    setToggling(userId);
    try {
      if (hasAccess) {
        await supabase.from("user_gcash_access").delete().eq("user_id", userId);
        setAccessMap((prev) => ({ ...prev, [userId]: false }));
      } else {
        await supabase.from("user_gcash_access").insert({ user_id: userId, granted_by: (await supabase.auth.getUser()).data.user?.id });
        setAccessMap((prev) => ({ ...prev, [userId]: true }));
      }
    } catch (err) {
      console.error("Failed to toggle GCash access", err);
    }
    setToggling(null);
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
            <Smartphone className="w-5 h-5 text-emerald-500" />
            GCash Cash In/Out Access
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Grant or revoke GCash Cash In/Out Tracker access for specific users.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
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
                <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => {
                const hasAccess = !!accessMap[u.id];
                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
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
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toggleAccess(u.id, hasAccess)}
                        disabled={toggling === u.id}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          hasAccess
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
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
        <span>Only non-admin users are shown. Admins already have full access.</span>
      </div>
    </div>
  );
}
