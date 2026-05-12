import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Check,
  Copy,
  Crosshair,
  Crown,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Package,
  Sparkles,
  Sun,
  Target,
  User,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/providers/auth";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UpgradePrompt from "@/components/UpgradePrompt";

export default function FBAdsTargeting() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token } = useAuth();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  const [businessName, setBusinessName] = useState("");
  const [product, setProduct] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const outputRef = useRef<HTMLPreElement>(null);

  const { usage, loading: usageLoading, increment } = useUsageLimit("fb-ads-targeting");

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const handleGenerate = async () => {
    if (!businessName || !product) {
      setError("Please enter your Business Name and Product.");
      return;
    }

    const incResult = await increment();
    if (!incResult.success) {
      if (incResult.limitReached) {
        setShowUpgrade(true);
        return;
      }
      setError(incResult.error || "Failed to check usage");
      return;
    }

    setIsGenerating(true);
    setOutput("");
    setError("");

    try {
      const res = await fetch("https://dkatgjtvhitknghvaxxn.supabase.co/functions/v1/deepseek-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a Filipino Facebook Ads strategist. Output clear, structured targeting suggestions with personas, interests, and actionable recommendations.",
            },
            {
              role: "user",
              content: `Business: ${businessName}\nProduct: ${product}\n\nGenerate FB Ads targeting: 3 personas, demographics, interests/behaviors, placements, budget, and quick ad angles. Taglish is fine.`,
            },
          ],
          max_tokens: 1400,
          temperature: 0.7,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Generation failed");

      setOutput(json.content || "No output");
    } catch (e: any) {
      setError(e?.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!user) return null;

  const remaining = usage?.remaining ?? 0;

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-4">
            <button
              onClick={() => navigate("/app")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Crosshair className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-foreground leading-none">BC AI</p>
                <p className="text-[10px] text-muted-foreground">Tool Kit</p>
              </div>
            </button>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[{ icon: LayoutDashboard, label: "Dashboard", path: "/app" }].map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        tooltip={item.label}
                        className="cursor-pointer gap-3 px-3 py-2.5 text-sm font-medium"
                      >
                        <item.icon className="w-[18px] h-[18px] stroke-[1.5]" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarSeparator className="mx-4 w-auto opacity-30" />

          <SidebarFooter className="p-4 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card group-data-[collapsible=icon]:hidden">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground leading-none">{user.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg group-data-[collapsible=icon]:hidden">
              {darkMode ? (
                <Moon className="w-[18px] h-[18px] stroke-[1.5] text-sidebar-foreground/60" />
              ) : (
                <Sun className="w-[18px] h-[18px] stroke-[1.5] text-sidebar-foreground/60" />
              )}
              <span className="text-sm text-sidebar-foreground/60 flex-1">Dark Mode</span>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} className="data-[state=checked]:bg-indigo-500" />
            </div>

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Log Out"
                  className="cursor-pointer gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-[18px] h-[18px] stroke-[1.5]" />
                  <span>Log Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between px-6 h-16">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-foreground leading-none">FB Ads Targeting</p>
                    <p className="text-[10px] text-muted-foreground">Deepseek-powered</p>
                  </div>
                </div>
              </div>

              {!usageLoading && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {usage?.plan === "pro"
                      ? `${remaining} / 500 left`
                      : usage?.plan === "vip"
                        ? `${remaining} / 100 left`
                        : `${remaining} / 3 left`}
                  </span>
                </div>
              )}
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Business Name</label>
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Con's Online Store"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Product</label>
                  <input
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Whitening Soap"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-2xl border border-red-200 bg-red-50 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-5 w-full px-5 py-4 rounded-2xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                {isGenerating ? "Generating…" : "Generate Targeting"}
              </button>
            </div>

            {output && (
              <div className="mt-6 bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <p className="text-sm font-extrabold text-foreground">Results</p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-accent text-xs font-bold"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre ref={outputRef} className="p-4 text-sm whitespace-pre-wrap text-foreground leading-relaxed">
{output}
                </pre>
              </div>
            )}

            {showUpgrade && (
              <div className="mt-6">
                <UpgradePrompt
                  feature="fb-ads-targeting"
                  used={usage?.used ?? 0}
                  limit={usage?.limit ?? 3}
                  plan={usage?.plan}
                  isVip={usage?.isVip}
                  onClose={() => setShowUpgrade(false)}
                />
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
