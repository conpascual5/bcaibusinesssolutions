import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/auth";
import { supabase } from "@/integrations/supabase/client";

interface BusinessTeamContextType {
  /** The user ID whose business data should be shown */
  businessOwnerId: string | null;
  /** The owner's profile info */
  ownerProfile: { full_name: string | null; email: string | null } | null;
  /** Whether the current user is a team member (not the owner) */
  isTeamMember: boolean;
  /** Loading state */
  loading: boolean;
}

const BusinessTeamContext = createContext<BusinessTeamContextType>({
  businessOwnerId: null,
  ownerProfile: null,
  isTeamMember: false,
  loading: true,
});

export function BusinessTeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businessOwnerId, setBusinessOwnerId] = useState<string | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      // Check if this user is a team member of someone
      const { data: membership } = await supabase
        .from("business_team_members")
        .select("owner_id")
        .eq("member_id", user.id)
        .maybeSingle();

      if (membership) {
        // This user is a team member — show the owner's data
        setBusinessOwnerId(membership.owner_id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", membership.owner_id)
          .single();
        setOwnerProfile(profile);
      } else {
        // This user is the owner — show their own data
        setBusinessOwnerId(user.id);
        setOwnerProfile(null);
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <BusinessTeamContext.Provider
      value={{
        businessOwnerId,
        ownerProfile,
        isTeamMember: !!ownerProfile,
        loading,
      }}
    >
      {children}
    </BusinessTeamContext.Provider>
  );
}

export function useBusinessTeam() {
  return useContext(BusinessTeamContext);
}
