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

const SESSION_TIMEOUT_MS = 8000;

const ADMIN_EMAILS = new Set(["conpascual5@gmail.com"]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (s: Session | null): Promise<AuthUser | null> => {
    if (!s?.user) return null;

    const email = s.user.email ?? "";

    if (ADMIN_EMAILS.has(email)) {
      return {
        id: s.user.id,
        email,
        name: (s.user.user_metadata as any)?.full_name ?? (s.user.user_metadata as any)?.name ?? "",
        isAdmin: true,
        plan: "pro_plus",
        isActive: true,
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, is_admin, plan, is_active")
      .eq("id", s.user.id)
      .maybeSingle();

    if (error || !data) {
      return {
        id: s.user.id,
        email,
        name: (s.user.user_metadata as any)?.full_name ?? (s.user.user_metadata as any)?.name ?? "",
        isAdmin: false,
        plan: "free",
        isActive: true,
      };
    }

    return {
      id: s.user.id,
      email,
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

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        console.warn("[auth] Session resolution timed out — forcing loading=false");
        // If getSession() timed out, the session is likely stale/corrupted
        // Clear it so the user can re-login
        if (mounted) {
          setSession(null);
          setUser(null);
          finishLoading();
        }
      }
    }, SESSION_TIMEOUT_MS);

    // Try to get the session with a race against the timeout
    const getSessionWithTimeout = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("getSession timed out")), SESSION_TIMEOUT_MS - 1000)
          ),
        ]);

        if (!mounted || resolved) return;

        if (result && result.data?.session) {
          console.log("[auth] Found existing session via getSession()");
          setSession(result.data.session);
          const profile = await fetchProfile(result.data.session);
          if (mounted) {
            setUser(profile);
            finishLoading();
          }
        } else {
          console.log("[auth] No existing session found");
          setSession(null);
          setUser(null);
          finishLoading();
        }
      } catch (err) {
        console.error("[auth] getSession failed or timed out:", err);
        // Session is stale — clear localStorage and treat as logged out
        const keysToRemove: string[] = [];
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.includes("supabase") || key.includes("sb-") || key.includes("auth-token"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        if (mounted) {
          setSession(null);
          setUser(null);
          finishLoading();
        }
      }
    };

    getSessionWithTimeout();

    // Subscribe to subsequent auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.log("[auth] onAuthStateChange event:", event, "hasSession:", !!newSession);

      if (event === "INITIAL_SESSION") {
        return;
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        finishLoading();
        window.location.href = "/auth";
        return;
      }

      if (newSession) {
        setSession(newSession);
        const profile = await fetchProfile(newSession);
        if (mounted) {
          setUser(profile);
          finishLoading();
        }
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
      },
      forceReset: async () => {
        const keysToRemove: string[] = [];
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (
            key.includes("supabase") ||
            key.includes("auth-token") ||
            key.includes("sb-") ||
            key.includes("oauth") ||
            key.includes("pkce") ||
            key.includes("code_verifier")
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
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
