import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { trpc } from "./trpc";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  token: string | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth-token"));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
      setReady(true);
    } else if (meQuery.isError) {
      localStorage.removeItem("auth-token");
      setToken(null);
      setUser(null);
      setReady(true);
    } else if (meQuery.isSuccess && meQuery.data === null) {
      localStorage.removeItem("auth-token");
      setToken(null);
      setUser(null);
      setReady(true);
    } else if (!token) {
      setReady(true);
    }
  }, [meQuery.data, meQuery.isError, meQuery.isSuccess, token]);

  const setAuth = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem("auth-token", newToken);
    setToken(newToken);
    setUser(newUser);
    setReady(true);
    utils.auth.me.invalidate();
  }, [utils]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth-token");
    setToken(null);
    setUser(null);
    utils.auth.me.invalidate();
    window.location.href = "/auth";
  }, [utils]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !ready,
        token,
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
