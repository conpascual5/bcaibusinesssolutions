import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  plan: "free" | "pro" | "vip";
  isActive: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  session: Session | null;
  token: string | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (s: Session | null) => {
    if (!s?.user) {
      setUser(null);
      return;
    }

    // Fetch profile fresh from database every time
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, is_admin, plan, is_active")
      .eq("id", s.user.id)
      .maybeSingle();

    if (error || !data) {
      // If profile is missing due to trigger delay, treat as loading user without admin.
      setUser({
        id: s.user.id,
        email: s.user.email ?? "",
        name: (s.user.user_metadata as any)?.full_name ?? (s.user.user_metadata as any)?.name ?? "",
        isAdmin: false,
        plan: "free",
        isActive: true,
      });
      return;
    }

    setUser({
      id: s.user.id,
      email: s.user.email ?? "",
      name:
        data?.full_name ??
        (s.user.user_metadata as any)?.full_name ??
        (s.user.user_metadata as any)?.name ??
        "",
      isAdmin: !!data?.is_admin,
      plan: (data?.plan as any) ?? "free",
      isActive: data?.is_active ?? true,
    });
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        await fetchProfile(data.session);
      } catch (err) {
        console.error("[auth] getSession error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      await fetchProfile(newSession);

      // Simple redirects for consistent UX
      if (event === "SIGNED_OUT") {
        window.location.href = "/auth";
      }
    });

    // Re-fetch profile when window gains focus (user comes back to tab)
    const onFocus = () => {
      if (session) {
        fetchProfile(session);
      }
    };
    window.addEventListener("focus", onFocus);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const token = session?.access_token ?? null;

  const value = useMemo(
    () => ({
      user,
      isLoading,
      session,
      token,
      logout: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, isLoading, session, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
