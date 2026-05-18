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

const SESSION_TIMEOUT_MS = 15000; // 15 seconds safety net

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (s: Session | null): Promise<AuthUser | null> => {
    if (!s?.user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, is_admin, plan, is_active")
      .eq("id", s.user.id)
      .maybeSingle();

    if (error || !data) {
      return {
        id: s.user.id,
        email: s.user.email ?? "",
        name: (s.user.user_metadata as any)?.full_name ?? (s.user.user_metadata as any)?.name ?? "",
        isAdmin: false,
        plan: "free",
        isActive: true,
      };
    }

    return {
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
    };
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

    // Step 1: Get the existing session first (most reliable for initial load)
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted || resolved) return;

      if (data.session) {
        setSession(data.session);
        const profile = await fetchProfile(data.session);
        if (mounted) {
          setUser(profile);
          finishLoading();
        }
      } else {
        setSession(null);
        setUser(null);
        finishLoading();
      }
    }).catch((err) => {
      console.error("[auth] getSession error:", err);
      if (mounted) {
        setSession(null);
        setUser(null);
        finishLoading();
      }
    });

    // Step 2: Subscribe to subsequent auth changes (SIGNED_IN, SIGNED_OUT, etc.)
    // We ignore INITIAL_SESSION since getSession() handles the initial state
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      // Skip INITIAL_SESSION — getSession() already handled it
      if (event === "INITIAL_SESSION") return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setSession(newSession);
        const profile = await fetchProfile(newSession);
        if (mounted) {
          setUser(profile);
          finishLoading();
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        finishLoading();
        window.location.href = "/auth";
      }
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
        // The onAuthStateChange SIGNED_OUT handler will redirect to /auth
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
