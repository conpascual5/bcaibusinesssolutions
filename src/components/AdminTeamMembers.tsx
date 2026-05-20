import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Users, UserPlus, X, Mail, Trash2, Shield, Check } from "lucide-react";
import { toast } from "sonner";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type TeamMemberRow = {
  id: string;
  member_id: string;
  role: string;
  created_at: string;
  profile: ProfileRow | null;
};

export default function AdminTeamMembers() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("full_name", { ascending: true });
      setUsers((data || []) as ProfileRow[]);
      setLoading(false);
    })();
  }, []);

  const loadMembers = async (userId: string) => {
    setLoadingMembers(true);
    const { data } = await supabase
      .from("business_team_members")
      .select("id, member_id, role, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      const membersWithProfiles = await Promise.all(
        data.map(async (m) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .eq("id", m.member_id)
            .single();
          return { ...m, profile } as TeamMemberRow;
        })
      );
      setMembers(membersWithProfiles);
    } else {
      setMembers([]);
    }
    setLoadingMembers(false);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setEmail("");
    setError("");
    if (userId) loadMembers(userId);
    else setMembers([]);
  };

  const addMember = async () => {
    if (!selectedUserId || !email.trim()) return;
    setError("");
    setAdding(true);

    try {
      const emailTrimmed = email.trim().toLowerCase();
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .ilike("email", emailTrimmed)
        .maybeSingle();

      if (profileError || !profile) {
        setError("No user found with that email address.");
        setAdding(false);
        return;
      }

      if (profile.id === selectedUserId) {
        setError("Cannot add the account owner as a team member.");
        setAdding(false);
        return;
      }

      const { data: existing } = await supabase
        .from("business_team_members")
        .select("id")
        .eq("owner_id", selectedUserId)
        .eq("member_id", profile.id)
        .maybeSingle();

      if (existing) {
        setError("This user is already a team member.");
        setAdding(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("business_team_members")
        .insert({ owner_id: selectedUserId, member_id: profile.id, role: "viewer" });

      if (insertError) {
        setError("Failed to add member.");
        setAdding(false);
        return;
      }

      toast.success(`${profile.full_name || profile.email} added as team member (₱69/month).`);
      setEmail("");
      await loadMembers(selectedUserId);
    } catch {
      setError("An unexpected error occurred.");
    }
    setAdding(false);
  };

  const removeMember = async (memberId: string) => {
    const { error: deleteError } = await supabase
      .from("business_team_members")
      .delete()
      .eq("owner_id", selectedUserId)
      .eq("member_id", memberId);

    if (!deleteError) {
      setMembers((prev) => prev.filter((m) => m.member_id !== memberId));
      toast.success("Team member removed.");
    }
  };

  const filteredUsers = users.filter((u) => {
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
            <Users className="w-5 h-5 text-indigo-500" />
            Team Members Management
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add or remove team members for any user's account. Each team member costs ₱69/month.
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

      {/* Select User */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <label className="block text-sm font-semibold text-foreground mb-2">Select Account Owner</label>
        <select
          value={selectedUserId}
          onChange={(e) => handleSelectUser(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— Choose a user —</option>
          {filteredUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || "Unnamed"} — {u.email || "no email"}
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          {/* Add Member Form */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-indigo-500" />
              Add Team Member (₱69/month)
            </h4>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMember()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={addMember}
                disabled={adding || !email.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Add Member
              </button>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </div>

          {/* Members List */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h4 className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Team Members ({members.length})
              </h4>
            </div>

            {loadingMembers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No team members yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Add a member above to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {member.profile?.full_name?.charAt(0)?.toUpperCase() ||
                         member.profile?.email?.charAt(0)?.toUpperCase() ||
                         "?"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {member.profile?.full_name || "Unnamed"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.profile?.email || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold">
                        <Shield className="w-3 h-3" />
                        {member.role === "admin" ? "Admin" : member.role === "editor" ? "Editor" : "Viewer"}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        ₱69/mo
                      </span>
                      <button
                        onClick={() => removeMember(member.member_id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Each team member costs ₱69/month. You can remove them at any time.</span>
          </div>
        </>
      )}
    </div>
  );
}
