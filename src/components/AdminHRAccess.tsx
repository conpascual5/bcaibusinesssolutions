import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Check, X, Search, Users, Shield, UserCheck,
  Plus, Minus, Link2, UserPlus
} from "lucide-react";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  plan: string;
};

type HRAccessRow = {
  user_id: string;
  business_id: string | null;
  is_active: boolean;
  seats: number;
  created_at: string;
};

type EmployeeRow = {
  id: string;
  first_name: string;
  last_name: string;
  auth_user_id: string | null;
  business_id: string;
};

export default function AdminHRAccess() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, HRAccessRow | null>>({});
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [adjustingSeats, setAdjustingSeats] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<string | null>(null);
  const [unlinkedEmployees, setUnlinkedEmployees] = useState<EmployeeRow[]>([]);
  const [linkingEmpId, setLinkingEmpId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [usersRes, accessRes, empRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, is_admin, plan").order("created_at", { ascending: false }),
        supabase.from("hr_user_access").select("user_id, business_id, is_active, seats"),
        supabase.from("hr_employees").select("id, first_name, last_name, auth_user_id, business_id"),
      ]);

      if (usersRes.data) {
        setUsers(usersRes.data as unknown as ProfileRow[]);
      }
      if (accessRes.data) {
        const map: Record<string, HRAccessRow> = {};
        (accessRes.data as unknown as HRAccessRow[]).forEach((a) => {
          map[a.user_id] = a;
        });
        setAccessMap(map);
      }
      if (empRes.data) {
        const counts: Record<string, number> = {};
        (empRes.data as EmployeeRow[]).forEach((e) => {
          counts[e.business_id] = (counts[e.business_id] || 0) + 1;
        });
        setEmployeeCounts(counts);
      }
      setLoading(false);
    })();
  }, []);

  const toggleAccess = async (userId: string, hasAccess: boolean) => {
    setToggling(userId);
    try {
      if (hasAccess) {
        await supabase
          .from("hr_user_access")
          .update({ is_active: false })
          .eq("user_id", userId)
          .eq("is_active", true);
        setAccessMap((prev) => ({ ...prev, [userId]: null }));
      } else {
        const { data: existing } = await supabase
          .from("hr_user_access")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("hr_user_access")
            .update({ is_active: true, seats: 10 })
            .eq("id", existing.id);
        } else {
          await supabase.from("hr_user_access").insert({
            user_id: userId,
            business_id: userId,
            is_active: true,
            seats: 10,
          });
        }
        setAccessMap((prev) => ({
          ...prev,
          [userId]: { user_id: userId, business_id: userId, is_active: true, seats: 10, created_at: new Date().toISOString() },
        }));
      }
    } catch (err) {
      console.error("Failed to toggle HR access", err);
    }
    setToggling(null);
  };

  const adjustSeats = async (userId: string, delta: number) => {
    const current = accessMap[userId];
    if (!current) return;
    const newSeats = Math.max(1, (current.seats || 10) + delta);
    setAdjustingSeats(userId);
    try {
      await supabase
        .from("hr_user_access")
        .update({ seats: newSeats })
        .eq("user_id", userId);
      setAccessMap((prev) => ({
        ...prev,
        [userId]: { ...prev[userId]!, seats: newSeats },
      }));
    } catch (err) {
      console.error("Failed to adjust seats", err);
    }
    setAdjustingSeats(null);
  };

  const openLinkModal = async (userId: string) => {
    setShowLinkModal(userId);
    // Fetch employees belonging to this user that have no auth_user_id linked
    const { data } = await supabase
      .from("hr_employees")
      .select("id, first_name, last_name, auth_user_id, business_id")
      .eq("business_id", userId)
      .is("auth_user_id", null)
      .order("last_name");
    setUnlinkedEmployees((data || []) as EmployeeRow[]);
  };

  const linkEmployeeToUser = async (employeeId: string, userId: string) => {
    setLinkingEmpId(employeeId);
    try {
      await supabase
        .from("hr_employees")
        .update({ auth_user_id: userId })
        .eq("id", employeeId);
      setUnlinkedEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    } catch (err) {
      console.error("Failed to link employee", err);
    }
    setLinkingEmpId(null);
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
            <Users className="w-5 h-5 text-cyan-500" />
            HR Management Access
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Grant or revoke standalone HR access. Each grant includes 10 employee seats by default.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-64"
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
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">HR Access</th>
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Seats</th>
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Employees</th>
                <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Link User</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => {
                const access = accessMap[u.id];
                const hasAccess = access?.is_active ?? false;
                const seats = access?.seats ?? 0;
                const empCount = employeeCounts[u.id] || 0;

                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-sm">{u.full_name || "Unnamed"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{u.email || "—"}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.plan === "pro_plus" ? "bg-rose-100 text-rose-700" :
                        u.plan === "pro" ? "bg-amber-100 text-amber-700" :
                        u.plan === "vip" ? "bg-purple-100 text-purple-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {u.plan || "free"}
                      </span>
                    </td>
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
                      {hasAccess ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => adjustSeats(u.id, -1)}
                            disabled={adjustingSeats === u.id || seats <= 1}
                            className="p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-sm min-w-[2rem] text-center">
                            {adjustingSeats === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                            ) : (
                              seats
                            )}
                          </span>
                          <button
                            onClick={() => adjustSeats(u.id, 1)}
                            disabled={adjustingSeats === u.id}
                            className="p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {hasAccess ? (
                        <span className={`text-sm font-semibold ${
                          empCount > seats ? "text-red-500" : "text-muted-foreground"
                        }`}>
                          {empCount} / {seats}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {hasAccess ? (
                        <button
                          onClick={() => openLinkModal(u.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Link
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toggleAccess(u.id, hasAccess)}
                        disabled={toggling === u.id}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          hasAccess
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                            : "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900/50"
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

      {/* Link Employee Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                Link Employee to Registered User
              </h3>
              <button
                onClick={() => { setShowLinkModal(null); setUnlinkedEmployees([]); }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-80 overflow-y-auto">
              {unlinkedEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No unlinked employees found.</p>
                  <p className="text-xs mt-1">Add employees first in the HR Employees section.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unlinkedEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {emp.first_name?.charAt(0)?.toUpperCase()}{emp.last_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-muted-foreground">Employee</p>
                        </div>
                      </div>
                      <button
                        onClick={() => linkEmployeeToUser(emp.id, showLinkModal)}
                        disabled={linkingEmpId === emp.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50"
                      >
                        {linkingEmpId === emp.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <><Link2 className="w-3.5 h-3.5" /> Link to User</>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Link an employee record to a registered user account so they can access the Employee Portal.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Shield className="w-3.5 h-3.5" />
        <span>Only non-admin users are shown. Each HR grant includes 10 employee seats by default.</span>
      </div>
    </div>
  );
}
