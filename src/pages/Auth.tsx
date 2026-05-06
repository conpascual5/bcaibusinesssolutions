import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Sparkles, ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth";
import { toast } from "sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, send them where they belong.
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    navigate(user.isAdmin ? "/admin" : "/app", { replace: true });
  }, [user, isLoading, navigate]);

  // Force clear session if stuck
  const forceLogout = async () => {
    // Clear all Supabase-related localStorage items
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes("supabase") || key.includes("auth-token") || key.includes("sb-"))) {
        localStorage.removeItem(key);
      }
    }
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    console.log("[auth] handleSubmit: starting", { mode, email });

    try {
      if (mode === "sign_up") {
        console.log("[auth] handleSubmit: signing up");
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });
        console.log("[auth] handleSubmit: signUp result", { data, error: signUpError });
        if (signUpError) throw signUpError;
        toast.success("Check your email for the confirmation link!");
      } else {
        console.log("[auth] handleSubmit: signing in");
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log("[auth] handleSubmit: signIn result", { data, error: signInError });
        if (signInError) throw signInError;
        // Navigation will happen via the auth state listener in AuthProvider
      }
    } catch (err: any) {
      console.error("[auth] handleSubmit: error", err);
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {mode === "sign_in" ? "Mag-Log In" : "Mag-Sign Up"}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === "sign_in"
              ? "Welcome back! I-login ang iyong account."
              : "Gumawa ng bagong account para magsimula."}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() => { setMode("sign_in"); setError(null); }}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                mode === "sign_in" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode("sign_up"); setError(null); }}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                mode === "sign_up" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "sign_up" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "sign_up" ? "At least 6 characters" : "Your password"}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "sign_in" ? "Mag-Log In" : "Mag-Sign Up"}
            </button>
          </form>

          <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-3">
            <p className="text-xs text-indigo-900">
              Tip: After signing up, check your email if confirmation is enabled in Supabase.
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={forceLogout}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors underline"
            >
              Stuck? Force reset session
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">BC AI Business Solutions — Marketing Tool Kit</p>
      </div>
    </div>
  );
}
