import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth";
import { toast } from "sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");

  // If already authenticated, send them where they belong.
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    navigate(user.isAdmin ? "/admin" : "/app", { replace: true });
  }, [user, isLoading, navigate]);

  // Keep the UI a bit more “BC AI” and less default.
  const appearance = useMemo(
    () => ({
      theme: ThemeSupa,
      variables: {
        default: {
          colors: {
            brand: "#4f46e5",
            brandAccent: "#4338ca",
            inputBackground: "#f8fafc",
            inputBorder: "#e2e8f0",
            inputBorderHover: "#cbd5e1",
            inputBorderFocus: "#4f46e5",
          },
          radii: {
            borderRadiusButton: "14px",
            buttonBorderRadius: "14px",
            inputBorderRadius: "14px",
          },
        },
      },
      className: {
        container: "w-full",
        button: "shadow-sm font-semibold",
        input: "text-gray-900",
        message: "text-sm",
      },
    }),
    []
  );

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
              onClick={() => setMode("sign_in")}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                mode === "sign_in" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setMode("sign_up")}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                mode === "sign_up" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          <Auth
            supabaseClient={supabase}
            providers={[]}
            view={mode}
            appearance={appearance}
            theme="light"
            redirectTo={window.location.origin + "/app"}
            showLinks={true}
            magicLink={false}
            additionalData={
              mode === "sign_up"
                ? {
                    full_name: "",
                  }
                : undefined
            }
            localization={{
              variables: {
                sign_in: {
                  email_label: "Email Address",
                  password_label: "Password",
                  button_label: "Mag-Log In",
                },
                sign_up: {
                  email_label: "Email Address",
                  password_label: "Password",
                  button_label: "Mag-Sign Up",
                  link_text: "Wala pang account? Mag-Sign Up",
                  confirmation_text: "Check your email for the confirmation link",
                },
              },
            }}
          />

          <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-3">
            <p className="text-xs text-indigo-900">
              Tip: After signing up, check your email if confirmation is enabled in Supabase.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">BC AI Business Solutions — Marketing Tool Kit</p>
      </div>
    </div>
  );
}

// Small helper: surface auth errors consistently
supabase.auth.onAuthStateChange((_event, _session) => {
  // no-op; provider handles redirects
});

// Handle Auth UI errors by listening to auth events is limited; we can at least toast on failures from API errors.
// (Auth UI itself shows inline errors.)
void supabase.auth.getSession().catch((e) => {
  toast.error(e?.message ?? "Auth error");
});
