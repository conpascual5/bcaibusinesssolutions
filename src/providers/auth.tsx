import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  plan: "free" | "pro" | "pro_plus" | "vip";
  isActive: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  session: Session | null;
  token: string | null;
  logout: () => Promise<void>;
  forceReset: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TIMEOUT_MS = 20000; // 20 seconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (s: Session | null) => {
    if (!s?.user) {
      setUser(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, is_admin, plan, is_active")
      .eq("id", s.user.id)
      .maybeSingle();

    if (error || !data) {
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
    let resolved = false;

    const finishLoading = () => {
      if (!resolved && mounted) {
        resolved = true;
        setIsLoading(false);
      }
    };

    // Safety timeout — always resolve loading after SESSION_TIMEOUT_MS
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        console.warn("[auth] Session resolution timed out — forcing loading=false");
        finishLoading();
      }
    }, SESSION_TIMEOUT_MS);

    // Subscribe to auth changes FIRST (before getSession) to catch INITIAL_SESSION
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === "INITIAL_SESSION") {
        if (!resolved) {
          setSession(newSession);
          await fetchProfile(newSession);
          finishLoading();
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setSession(newSession);
        await fetchProfile(newSession);
        finishLoading();
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        finishLoading();
        window.location.href = "/auth";
      }
    });

    // Also check for existing session directly as a fallback
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || resolved) return;

      if (data.session) {
        setSession(data.session);
        return fetchProfile(data.session).then(finishLoading).catch(() => finishLoading());
      } else {
        setSession(null);
        setUser(null);
        finishLoading();
      }
    }).catch((err) => {
      console.error("[auth] getSession error:", err);
      setSession(null);
      setUser(null);
      finishLoading();
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      sub.subscription.unsubscribe();
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
        window.location.href = "/auth";
      },
      forceReset: async () => {
        // Clear all Supabase-related localStorage items
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.includes("supabase") || key.includes("auth-token") || key.includes("sb-"))) {
            localStorage.removeItem(key);
          }
        }
        await supabase.auth.signOut();
        window.location.reload();
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
