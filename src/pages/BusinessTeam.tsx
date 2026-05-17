import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, X, Mail, UserCheck, Shield, Trash2, Users } from "lucide-react";
import BusinessLayout from "@/components/BusinessLayout";

type TeamMember = {
  id: string;
  member_id: string;
  role: string;
  created_at: string;
  profile: {
    email: string | null;
    full_name: string | null;
  } | null;
};

export default function BusinessTeam() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMembers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("business_team_members")
      .select("id, member_id, role, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profiles for each member
      const membersWithProfiles = await Promise.all(
        data.map(async (m) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", m.member_id)
            .single();
          return { ...m, profile } as TeamMember;
        })
      );
      setMembers(membersWithProfiles);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, [user]);

  const addMember = async () => {
    if (!user || !email.trim()) return;
    setError("");
    setSuccess("");
    setAdding(true);

    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (profileError || !profile) {
        setError("No user found with that email address.");
        setAdding(false);
        return;
      }

      if (profile.id === user.id) {
        setError("You cannot add yourself as a team member.");
        setAdding(false);
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("business_team_members")
        .select("id")
        .eq("owner_id", user.id)
        .eq("member_id", profile.id)
        .maybeSingle();

      if (existing) {
        setError("This user is already a team member.");
        setAdding(false);
        return;
      }

      // Add member
      const { error: insertError } = await supabase
        .from("business_team_members")
        .insert({ owner_id: user.id, member_id: profile.id, role: "viewer" });

      if (insertError) {
        setError("Failed to add member. Please try again.");
        setAdding(false);
        return;
      }

      setSuccess(`${profile.full_name || profile.email} has been added to your team!`);
      setEmail("");
      await loadMembers();
    } catch {
      setError("An unexpected error occurred.");
    }
    setAdding(false);
  };

  const removeMember = async (memberId: string) => {
    if (!user) return;
    const { error: deleteError } = await supabase
      .from("business_team_members")
      .delete()
      .eq("owner_id", user.id)
      .eq("member_id", memberId);

    if (!deleteError) {
      setMembers((prev) => prev.filter((m) => m.member_id !== memberId));
      setSuccess("Team member removed.");
    }
  };

  return (
    <BusinessLayout
      title="Team"
      description="Invite people to view and manage your business data"
    >
      <div className="space-y-6">
        {/* Add Member Form */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-indigo-500" />
            Invite a Team Member
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the email address of the user you want to add. They'll be able to view and manage your business data.
          </p>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          {success && (
            <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> {success}
            </p>
          )}
        </div>

        {/* Members List */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Team Members ({members.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No team members yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Invite someone above to get started.
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
          <span>Team members can view and manage your business data. You can remove them at any time.</span>
        </div>
      </div>
    </BusinessLayout>
  );
}
