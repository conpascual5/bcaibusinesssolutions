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
      console.log("[auth] fetchProfile: no session user, clearing user");
      setUser(null);
      return;
    }

    console.log("[auth] fetchProfile: fetching for email:", s.user.email);

    // Fetch profile from the users table using email as the lookup
    const { data, error } = await supabase
      .from("users")
      .select("name, is_admin, plan, is_active")
      .eq("email", s.user.email)
      .maybeSingle();

    console.log("[auth] fetchProfile: result", { data, error });

    if (error || !data) {
      console.log("[auth] fetchProfile: no matching user in users table, using defaults", { error });
      // If no matching user in the users table, treat as non-admin
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

    console.log("[auth] fetchProfile: found user in users table", data);

    setUser({
      id: s.user.id,
      email: s.user.email ?? "",
      name:
        data?.name ??
        (s.user.user_metadata as any)?.full_name ??
        (s.user.user_metadata as any)?.name ??
        "",
      isAdmin: data?.is_admin === 1,
      plan: (data?.plan as any) ?? "free",
      isActive: data?.is_active === 1,
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
      console.log("[auth] onAuthStateChange event:", event, "session:", !!newSession);
      if (!mounted) return;
      setSession(newSession);
      await fetchProfile(newSession);

      if (event === "SIGNED_OUT") {
        window.location.href = "/auth";
      }
    });

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
