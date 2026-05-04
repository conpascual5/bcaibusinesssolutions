import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function Setup() {
  const [pushing, setPushing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [pushResult, setPushResult] = useState<"idle" | "success" | "error">("idle");
  const [seedResult, setSeedResult] = useState<"idle" | "success" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("");
  const [seedMessage, setSeedMessage] = useState("");

  const handlePush = async () => {
    setPushing(true);
    setPushResult("idle");
    setPushMessage("");
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPushResult("success");
        setPushMessage(data.message);
      } else {
        setPushResult("error");
        setPushMessage(data.error || "Unknown error");
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
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedResult("success");
        setSeedMessage(data.message);
      } else {
        setSeedResult("error");
        setSeedMessage(data.error || "Unknown error");
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Step 1: Create Tables</p>
                <p className="text-sm text-slate-400">Push Drizzle schema to TiDB</p>
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
                  conpascual5@gmail.com / admin123
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
        </CardContent>
      </Card>
    </div>
  );
}
