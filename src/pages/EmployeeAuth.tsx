import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Clock, ShieldCheck, Building2, Sparkles } from "lucide-react";

type CompanyInfo = {
  name: string;
  logo_url: string | null;
};

export default function EmployeeAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Look up company branding when email changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Reset if email is empty or doesn't look like an email
    if (!email.includes("@") || !email.includes(".")) {
      setCompany(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLookingUp(true);
      try {
        // Find employee by email to get their business_id
        const { data: emp } = await supabase
          .from("hr_employees")
          .select("business_id")
          .eq("email", email)
          .eq("is_active", true)
          .maybeSingle();

        if (emp) {
          // Fetch company info for that business
          const { data: comp } = await supabase
            .from("hr_company")
            .select("name, logo_url")
            .eq("business_id", emp.business_id)
            .maybeSingle();

          if (comp) {
            setCompany({ name: comp.name, logo_url: comp.logo_url });
          } else {
            setCompany(null);
          }
        } else {
          setCompany(null);
        }
      } catch {
        setCompany(null);
      }
      setLookingUp(false);
    }, 600); // debounce 600ms

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate("/employee/portal");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setError("Account created! You can now log in.");
        setMode("login");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
    setLoading(false);
  };

  const displayName = company?.name || "Employee Portal";
  const displayLogo = company?.logo_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {displayLogo ? (
            <div className="flex justify-center mb-4">
              <img
                src={displayLogo}
                alt={displayName}
                className="h-16 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {company?.name
              ? "Clock in, clock out, and manage your leave"
              : "Clock in, clock out, and manage your leave requests"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-6">
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                {lookingUp && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {error && (
              <div className={`px-4 py-3 rounded-xl text-sm ${
                error.includes("created") || error.includes("can now")
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              For employees — access provided by your employer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
