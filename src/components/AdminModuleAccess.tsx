import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X, Search, Users, Shield, UserCheck, Sparkles } from "lucide-react";
import { MODULE_LABELS, type ModuleKey } from "@/providers/module-access";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  plan: string;
};

type ModuleAccessRow = {
  user_id: string;
  module: string;
  is_active: boolean;
};

const ALL_MODULES: ModuleKey[] = [
  'sales_wizard', 'sales_report', 'fb_ads_targeting',
  'image_analyzer', 'ad_analyzer', 'invoices',
  'my_assets', 'library'
];

const MODULE_COLORS: Record<ModuleKey, string> = {
  sales_wizard: 'bg-violet-500',
  sales_report: 'bg-blue-500',
  fb_ads_targeting: 'bg-rose-500',
  image_analyzer: 'bg-amber-500',
  ad_analyzer: 'bg-cyan-500',
  invoices: 'bg-emerald-500',
  my_assets: 'bg-indigo-500',
  library: 'bg-purple-500',
};

export default function AdminModuleAccess() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, ModuleKey[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [usersRes, accessRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, is_admin, plan").order("created_at", { ascending: false }),
        supabase.from("user_module_access").select("user_id, module, is_active"),
      ]);

      if (usersRes.data) {
        setUsers(usersRes.data as unknown as ProfileRow[]);
      }
      if (accessRes.data) {
        const map: Record<string, ModuleKey[]> = {};
        (accessRes.data as unknown as ModuleAccessRow[]).forEach((a) => {
          if (a.is_active) {
            if (!map[a.user_id]) map[a.user_id] = [];
            map[a.user_id].push(a.module as ModuleKey);
          }
        });
        setAccessMap(map);
      }
      setLoading(false);
    })();
  }, []);

  const toggleModule = async (userId: string, module: ModuleKey, hasAccess: boolean) => {
    setToggling(`${userId}-${module}`);
    try {
      if (hasAccess) {
        // Deactivate
        await supabase
          .from("user_module_access")
          .update({ is_active: false })
          .eq("user_id", userId)
          .eq("module", module)
          .eq("is_active", true);
        setAccessMap((prev) => ({
          ...prev,
          [userId]: (prev[userId] || []).filter(m => m !== module),
        }));
      } else {
        // Check if there's already a record
        const { data: existing } = await supabase
          .from("user_module_access")
          .select("id")
          .eq("user_id", userId)
          .eq("module", module)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("user_module_access")
            .update({ is_active: true })
            .eq("id", existing.id);
        } else {
          await supabase.from("user_module_access").insert({
            user_id: userId,
            module,
            is_active: true,
          });
        }
        setAccessMap((prev) => ({
          ...prev,
          [userId]: [...(prev[userId] || []), module],
        }));
      }
    } catch (err) {
      console.error("Failed to toggle module access", err);
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
            <Sparkles className="w-5 h-5 text-violet-500" />
            Module Access Management
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Grant or revoke access to individual modules. Pro Plus and VIP users automatically get all modules.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
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
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan</th>
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Modules</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => {
                const userModules = accessMap[u.id] || [];
                const isProPlus = u.plan === "vip";
                const canToggle = !isProPlus;

                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-sm">{u.full_name || "Unnamed"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{u.email || "—"}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.plan === "pro" ? "bg-amber-100 text-amber-700" :
                        u.plan === "vip" ? "bg-purple-100 text-purple-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {u.plan || "free"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {isProPlus ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
                            <Check className="w-3 h-3" /> All Modules
                          </span>
                        ) : userModules.length > 0 ? (
                          userModules.map(m => (
                            <span key={m} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${MODULE_COLORS[m] || 'bg-gray-500'}`}>
                              {MODULE_LABELS[m]}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded-full text-xs font-bold">
                            <X className="w-3 h-3" /> None
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {canToggle ? (
                        <button
                          onClick={() => setSelectedUser(selectedUser === u.id ? null : u.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            selectedUser === u.id
                              ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                          {selectedUser === u.id ? "Close" : "Edit Modules"}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Auto (Pro Plus/VIP)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Module Toggle Panel */}
      {selectedUser && (() => {
        const u = users.find(x => x.id === selectedUser);
        if (!u) return null;
        const userModules = accessMap[u.id] || [];
        return (
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Toggle Modules for {u.full_name || u.email}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click to toggle individual module access
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 hover:bg-muted rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {ALL_MODULES.map((mod) => {
                const hasAccess = userModules.includes(mod);
                const isToggling = toggling === `${u.id}-${mod}`;
                return (
                  <button
                    key={mod}
                    onClick={() => toggleModule(u.id, mod, hasAccess)}
                    disabled={isToggling}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      hasAccess
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    } disabled:opacity-50`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${MODULE_COLORS[mod]} flex items-center justify-center`}>
                      {hasAccess ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-white text-xs font-bold">+</span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{MODULE_LABELS[mod]}</p>
                      <p className="text-xs text-muted-foreground">
                        {hasAccess ? 'Granted' : 'Not granted'}
                      </p>
                    </div>
                    {isToggling && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Shield className="w-3.5 h-3.5" />
        <span>Pro Plus and VIP users automatically get all module access. Only non-admin users are shown.</span>
      </div>
    </div>
  );
}
