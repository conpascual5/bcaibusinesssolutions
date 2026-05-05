import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function Setup() {
  const [pushing, setPushing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [pushResult, setPushResult] = useState<"idle" | "success" | "error">("idle");
  const [seedResult, setSeedResult] = useState<"idle" | "success" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("");
  const [seedMessage, setSeedMessage] = useState("");

  const checkAdmin = trpc.setup.checkAdminExists.useQuery();
  const createAdmin = trpc.setup.createAdmin.useMutation();

  const handlePush = async () => {
    setPushing(true);
    setPushResult("idle");
    setPushMessage("");
    try {
      // Try the API setup endpoint first
      const res = await fetch("/api/setup", { method: "POST" });
      const contentType = res.headers.get("content-type") || "";
      let data: any;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        setPushResult("error");
        setPushMessage(`Server returned non-JSON response (${res.status}): ${text.slice(0, 200)}`);
        setPushing(false);
        return;
      }
      if (data.success) {
        setPushResult("success");
        setPushMessage(data.message);
      } else {
        // Try fallback endpoint
        const fallbackRes = await fetch("/api/setup-tables", { method: "POST" });
        const fbContentType = fallbackRes.headers.get("content-type") || "";
        let fallbackData: any;
        if (fbContentType.includes("application/json")) {
          fallbackData = await fallbackRes.json();
        } else {
          const text = await fallbackRes.text();
          setPushResult("error");
          setPushMessage(`Fallback returned non-JSON (${fallbackRes.status}): ${text.slice(0, 200)}`);
          setPushing(false);
          return;
        }
        if (fallbackData.success) {
          setPushResult("success");
          setPushMessage(fallbackData.message);
        } else {
          setPushResult("error");
          setPushMessage(fallbackData.error || data.error || "Unknown error");
        }
      }
    } catch (err) {
      setPushResult("error");
      setPushMessage(String(err));
    } finally {
      setPushing(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult("idle");
    setSeedMessage("");
    try {
      // Try the API seed endpoint first
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedResult("success");
        setSeedMessage(data.message);
      } else {
        // Fallback: try creating admin via tRPC
        try {
          const result = await createAdmin.mutateAsync({
            email: "conpascual5@gmail.com",
            password: "admin123",
            name: "BC AI Admin",
          });
          setSeedResult("success");
          setSeedMessage(`Admin user created: ${result.email}`);
        } catch (trpcErr: any) {
          setSeedResult("error");
          setSeedMessage(trpcErr?.message || data.error || "Unknown error");
        }
      }
    } catch (err) {
      setSeedResult("error");
      setSeedMessage(String(err));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Database Setup</CardTitle>
          <CardDescription className="text-slate-400">
            Set up the database tables and create the admin user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {checkAdmin.data?.exists && (
            <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-3 text-sm text-emerald-300">
              ✓ Admin user already exists — setup may already be complete.
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Step 1: Create Tables</p>
                <p className="text-sm text-slate-400">Push schema to database</p>
              </div>
              <Button
                onClick={handlePush}
                disabled={pushing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {pushing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : pushResult === "success" ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : null}
                {pushing ? "Pushing..." : "Push Schema"}
              </Button>
            </div>
            {pushMessage && (
              <p
                className={`text-sm ${
                  pushResult === "success" ? "text-green-400" : "text-red-400"
                }`}
              >
                {pushMessage}
              </p>
            )}
          </div>

          <div className="border-t border-slate-700 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Step 2: Create Admin User</p>
                <p className="text-sm text-slate-400">
                  Creates the default admin account
                </p>
              </div>
              <Button
                onClick={handleSeed}
                disabled={seeding || pushResult !== "success"}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {seeding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : seedResult === "success" ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : null}
                {seeding ? "Seeding..." : "Seed Admin"}
              </Button>
            </div>
            {seedMessage && (
              <p
                className={`text-sm ${
                  seedResult === "success" ? "text-green-400" : "text-red-400"
                }`}
              >
                {seedMessage}
              </p>
            )}
          </div>

          {(pushResult === "success" && seedResult === "success") && (
            <div className="border-t border-slate-700 pt-4">
              <p className="text-green-400 font-medium text-center">
                ✅ Setup complete! You can now log in.
              </p>
            </div>
          )}

          {checkAdmin.data?.exists && (
            <div className="border-t border-slate-700 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reactivate Admin</p>
                  <p className="text-sm text-slate-400">
                    If your admin account was accidentally deactivated
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/reactivate-admin", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: "conpascual5@gmail.com" }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert("Admin account reactivated! Please log in again.");
                      } else {
                        alert("Failed: " + (data.error || "Unknown error"));
                      }
                    } catch (err) {
                      alert("Failed to reactivate: " + String(err));
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Reactivate Admin
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
