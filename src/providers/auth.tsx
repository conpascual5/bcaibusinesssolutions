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
  forceReset: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

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
        plan: "pro",
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

    // Safety timeout — if nothing resolves in 15s, stop loading anyway
    const safetyTimeout = setTimeout(() => {
      if (!resolved && mounted) {
        console.warn("[auth] Safety timeout — forcing loading=false");
        finishLoading();
      }
    }, 15000);

    // Use ONLY onAuthStateChange — no getSession() call that can hang
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.log("[auth] onAuthStateChange event:", event, "hasSession:", !!newSession);

      if (event === "INITIAL_SESSION") {
        // This fires on page load with the current session (or null)
        if (newSession) {
          setSession(newSession);
          const profile = await fetchProfile(newSession);
          if (mounted) {
            setUser(profile);
            finishLoading();
          }
        } else {
          if (mounted) {
            setSession(null);
            setUser(null);
            finishLoading();
          }
        }
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
      clearTimeout(safetyTimeout);
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
