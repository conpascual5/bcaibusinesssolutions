import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { Sparkles, ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth";
import { toast } from "sonner";

function getPostAuthRedirect(isAdmin: boolean) {
  return isAdmin ? "/admin" : "/app";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, isLoading, forceReset } = useAuth();
  const redirectAttempted = useRef(false);

  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // If already authenticated, send them where they belong (only once)
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (redirectAttempted.current) return;
    redirectAttempted.current = true;
    
    const dest = getPostAuthRedirect(user.isAdmin);
    navigate(dest, { replace: true });
  }, [user, isLoading, navigate]);

  const handleForceReset = async () => {
    setResetting(true);
    try {
      await forceReset();
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "sign_up") {
        if (!agreedToTerms) {
          setError("You must agree to the terms and conditions to sign up.");
          setSubmitting(false);
          return;
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });
        if (signUpError) throw signUpError;
        toast.success("Check your email for the confirmation link!");
        setMode("sign_in");
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        // Immediately navigate — don't wait for onAuthStateChange
        if (data?.user) {
          const isAdmin = data.user.app_metadata?.is_admin ?? false;
          const dest = getPostAuthRedirect(isAdmin);
          navigate(dest, { replace: true });
        }
      }
    } catch (err: any) {
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

            {mode === "sign_up" && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  I have read and agree to the{" "}
                  <Link to="/terms" className="text-indigo-600 hover:text-indigo-700 underline font-medium">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700 underline font-medium">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={submitting || (mode === "sign_up" && !agreedToTerms)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "sign_in" ? "Mag-Log In" : "Mag-Sign Up"}
            </button>
          </form>

          {mode === "sign_up" && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-900 mb-1">📧 Confirm your email to log in</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                After signing up, Supabase will send a confirmation link to your email.
                You <strong>must click that link</strong> before you can log in.
                If you don't see it, check your Spam or Promotions folder.
              </p>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={handleForceReset}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors underline disabled:opacity-50"
            >
              {resetting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Stuck? Force reset session
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">BC AI Business Solutions — Marketing Tool Kit</p>
      </div>
    </div>
  );
}
