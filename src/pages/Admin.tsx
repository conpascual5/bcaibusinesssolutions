import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth";
import AdminSupportInbox from "@/components/AdminSupportInbox";
import AdminDashboard from "@/components/AdminDashboard";
import AdminDownloads from "@/components/AdminDownloads";
import AdminBMSAccess from "@/components/AdminBMSAccess";
import AdminGCashAccess from "@/components/AdminGCashAccess";
import { trackEvent } from "@/lib/metaPixel";
import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  Settings,
  Shield,
  CheckCircle,
  XCircle,
  Star,
  Crown,
  Sparkles,
  X,
  Clock,
  History,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Package,
  Upload,
  ImageIcon,
  Film,
  Trash2,
  Loader2,
  ExternalLink,
  Download,
  Activity,
  Building2,
  Smartphone,
  Gift,
  DollarSign,
  Wallet,
  Banknote,
  FileText,
} from "lucide-react";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  plan: "free" | "pro" | "vip";
  is_active: boolean;
  activated_at: string | null;
  created_at: string;
  email_confirmed_at: string | null;
};

type PlanHistoryRow = {
  id: number;
  user_id: string;
  plan: string;
  previous_plan: string | null;
  set_by: string | null;
  notes: string | null;
  created_at: string;
};

function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralProfiles, setReferralProfiles] = useState<Record<string, any>>({});
  const [downline, setDownline] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    // Fetch affiliates and their profiles separately since there's no FK
    const { data: affData } = await supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });

    if (affData && affData.length > 0) {
      // Fetch profiles for all affiliates
      const userIds = affData.map((a: any) => a.user_id);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap: Record<string, any> = {};
      (profileData || []).forEach((p: any) => {
        profileMap[p.id] = p;
      });

      const enriched = affData.map((a: any) => ({
        ...a,
        profiles: profileMap[a.user_id] || null,
      }));
      setAffiliates(enriched);
    } else {
      setAffiliates(affData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  const loadDetails = async (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setDetailLoading(true);

    const [payoutRes, commRes, refRes] = await Promise.all([
      supabase.from("affiliate_payouts").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
      supabase.from("affiliate_commissions").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
      supabase.from("affiliate_referrals").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
    ]);

    setPayouts(payoutRes.data || []);
    setCommissions(commRes.data || []);
    const referralsData = refRes.data || [];
    setReferrals(referralsData);

    // Fetch profiles for referred users
    const referredUserIds = referralsData
      .map((r: any) => r.referred_user_id)
      .filter(Boolean);
    const profileMap: Record<string, any> = {};
    if (referredUserIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", referredUserIds);
      (profileData || []).forEach((p: any) => {
        profileMap[p.id] = p;
      });
    }
    setReferralProfiles(profileMap);

    // Find downline: referred users who also became affiliates
    if (referredUserIds.length > 0) {
      const { data: downlineData } = await supabase
        .from("affiliates")
        .select("*")
        .in("user_id", referredUserIds);

      if (downlineData && downlineData.length > 0) {
        const downlineUserIds = downlineData.map((d: any) => d.user_id);
        const { data: downlineProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", downlineUserIds);

        const downlineProfileMap: Record<string, any> = {};
        (downlineProfiles || []).forEach((p: any) => {
          downlineProfileMap[p.id] = p;
        });

        setDownline(
          downlineData.map((d: any) => ({
            ...d,
            profiles: downlineProfileMap[d.user_id] || null,
          }))
        );
      } else {
        setDownline([]);
      }
    } else {
      setDownline([]);
    }

    setDetailLoading(false);
  };

  const handleApprovePayout = async (payoutId: string) => {
    await supabase.from("affiliate_payouts").update({ status: "approved" }).eq("id", payoutId);
    toast.success("Payout approved");
    if (selectedAffiliate) loadDetails(selectedAffiliate);
  };

  const handleCompletePayout = async (payoutId: string, affiliateId: string, amount: number) => {
    await supabase.from("affiliate_payouts").update({ status: "completed", processed_at: new Date().toISOString() }).eq("id", payoutId);
    // Update affiliate totals
    await supabase.rpc("update_affiliate_payout", { p_affiliate_id: affiliateId, p_amount: amount });
    toast.success("Payout marked as completed");
    fetchAffiliates();
    if (selectedAffiliate) loadDetails(selectedAffiliate);
  };

  const handleRejectPayout = async (payoutId: string) => {
    await supabase.from("affiliate_payouts").update({ status: "rejected" }).eq("id", payoutId);
    toast.success("Payout rejected");
    if (selectedAffiliate) loadDetails(selectedAffiliate);
  };

  const handleAddCommission = async () => {
    if (!selectedAffiliate) return;
    // This will be triggered from the admin setting a plan — we'll handle it via the plan change flow
  };

  return (
    <div className="space-y-6">
      {/* Affiliates List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
            <Gift className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
            Affiliates
          </h2>
          <button onClick={fetchAffiliates} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading affiliates...</div>
        ) : affiliates.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center py-12">No affiliates yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Affiliate</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Code</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">Earned</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">Pending</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">Paid Out</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {affiliates.map((a: any) => (
                  <tr key={a.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{a.profiles?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{a.profiles?.email || ""}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">{a.referral_code}</code>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(a.total_earned)}</td>
                    <td className="px-6 py-4 text-right text-amber-600 font-medium">{formatCurrency(a.pending_balance)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(a.total_paid_out)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        a.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {a.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => loadDetails(a)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Affiliate Detail Panel */}
      {selectedAffiliate && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Gift className="w-5 h-5 text-indigo-500" />
                {selectedAffiliate.profiles?.full_name || "Affiliate"} — <code className="bg-muted px-2 py-0.5 rounded font-mono text-sm">{selectedAffiliate.referral_code}</code>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedAffiliate.profiles?.email}</p>
            </div>
            <button
              onClick={() => setSelectedAffiliate(null)}
              className="p-2 rounded-xl hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {detailLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading details...</div>
          ) : (
            <Tabs defaultValue="payouts" className="space-y-4">
              <TabsList>
                <TabsTrigger value="payouts" className="gap-2">
                  <Wallet className="w-4 h-4" /> Payout Requests ({payouts.length})
                </TabsTrigger>
                <TabsTrigger value="commissions" className="gap-2">
                  <DollarSign className="w-4 h-4" /> Commissions ({commissions.length})
                </TabsTrigger>
                <TabsTrigger value="referrals" className="gap-2">
                  <Users className="w-4 h-4" /> Referrals ({referrals.length})
                </TabsTrigger>
                <TabsTrigger value="downline" className="gap-2">
                  <Users className="w-4 h-4" /> Sub-Affiliates ({downline.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="payouts">
                {payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No payout requests.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-3 font-medium text-muted-foreground">Method</th>
                          <th className="text-right py-3 font-medium text-muted-foreground">Amount</th>
                          <th className="text-left py-3 font-medium text-muted-foreground">Details</th>
                          <th className="text-right py-3 font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {payouts.map((p: any) => (
                          <tr key={p.id} className="hover:bg-accent/50">
                            <td className="py-3 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="py-3 capitalize">{p.payment_method}</td>
                            <td className="py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                            <td className="py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                              {p.payment_method === "gcash"
                                ? `${p.gcash_name} — ${p.gcash_number}`
                                : `${p.bank_name} — ${p.bank_account_name} (${p.bank_account_number})`}
                            </td>
                            <td className="py-3 text-right">
                              <Badge variant={
                                p.status === "completed" ? "default" :
                                p.status === "approved" ? "secondary" :
                                p.status === "rejected" ? "destructive" : "outline"
                              } className="text-xs capitalize">
                                {p.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {p.status === "pending" && (
                                  <>
                                    <button onClick={() => handleApprovePayout(p.id)}
                                      className="px-2 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200">
                                      Approve
                                    </button>
                                    <button onClick={() => handleRejectPayout(p.id)}
                                      className="px-2 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
                                      Reject
                                    </button>
                                  </>
                                )}
                                {p.status === "approved" && (
                                  <button onClick={() => handleCompletePayout(p.id, selectedAffiliate.id, p.amount)}
                                    className="px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                                    Mark Completed
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="commissions">
                {commissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No commissions yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-3 font-medium text-muted-foreground">Plan</th>
                          <th className="text-right py-3 font-medium text-muted-foreground">Amount</th>
                          <th className="text-right py-3 font-medium text-muted-foreground">Rate</th>
                          <th className="text-right py-3 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {commissions.map((c: any) => (
                          <tr key={c.id} className="hover:bg-accent/50">
                            <td className="py-3 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                            <td className="py-3 capitalize">{c.plan}</td>
                            <td className="py-3 text-right font-medium">{formatCurrency(c.amount)}</td>
                            <td className="py-3 text-right text-muted-foreground">{c.commission_rate}%</td>
                            <td className="py-3 text-right">
                              <Badge variant={
                                c.status === "paid" ? "default" :
                                c.status === "approved" ? "secondary" :
                                c.status === "cancelled" ? "destructive" : "outline"
                              } className="text-xs capitalize">{c.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="referrals">
                {referrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No referrals yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 font-medium text-muted-foreground">Name</th>
                          <th className="text-left py-3 font-medium text-muted-foreground">Email</th>
                          <th className="text-left py-3 font-medium text-muted-foreground">Joined</th>
                          <th className="text-right py-3 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {referrals.map((r: any) => {
                          const profile = referralProfiles[r.referred_user_id];
                          return (
                            <tr key={r.id} className="hover:bg-accent/50">
                              <td className="py-3">{profile?.full_name || "—"}</td>
                              <td className="py-3 text-xs text-muted-foreground">{profile?.email || r.referred_email || "—"}</td>
                              <td className="py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                              <td className="py-3 text-right">
                                <Badge variant={
                                  r.status === "active" ? "default" :
                                  r.status === "cancelled" ? "destructive" : "outline"
                                } className="text-xs capitalize">{r.status}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* Downline / Sub-Affiliates Tab */}
              <TabsContent value="downline">
                {downline.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No referred users have become affiliates yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 font-medium text-muted-foreground">Name</th>
                          <th className="text-left py-3 font-medium text-muted-foreground">Email</th>
                          <th className="text-left py-3 font-medium text-muted-foreground">Referral Code</th>
                          <th className="text-right py-3 font-medium text-muted-foreground">Earned</th>
                          <th className="text-right py-3 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {downline.map((d: any) => (
                          <tr key={d.id} className="hover:bg-accent/50">
                            <td className="py-3">{d.profiles?.full_name || "—"}</td>
                            <td className="py-3 text-xs text-muted-foreground">{d.profiles?.email || "—"}</td>
                            <td className="py-3">
                              <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">{d.referral_code}</code>
                            </td>
                            <td className="py-3 text-right font-medium">{formatCurrency(d.total_earned)}</td>
                            <td className="py-3 text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                d.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                              }`}>
                                {d.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {d.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
}

function ApiKeySettings() {
  const [aiKey, setAiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");
  const [showAiKey, setShowAiKey] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [openaiSaved, setOpenaiSaved] = useState(false);
  const [deepseekSaved, setDeepseekSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [ai, open, ds] = await Promise.all([
        supabase.from("settings").select("value").eq("key", "ai_api_key").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "openai_api_key").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "deepseek_api_key").maybeSingle(),
      ]);
      if (cancelled) return;
      setAiKey((ai.data as any)?.value ?? "");
      setOpenaiKey((open.data as any)?.value ?? "");
      setDeepseekKey((ds.data as any)?.value ?? "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upsertKey = async (key: string, value: string) => {
    await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
  };

  const handleSaveAiKey = async () => {
    if (!aiKey.trim()) return;
    await upsertKey("ai_api_key", aiKey.trim());
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 1500);
  };

  const handleSaveOpenai = async () => {
    if (!openaiKey.trim()) return;
    await upsertKey("openai_api_key", openaiKey.trim());
    setOpenaiSaved(true);
    setTimeout(() => setOpenaiSaved(false), 1500);
  };

  const handleSaveDeepseek = async () => {
    if (!deepseekKey.trim()) return;
    await upsertKey("deepseek_api_key", deepseekKey.trim());
    setDeepseekSaved(true);
    setTimeout(() => setDeepseekSaved(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5 mb-1">
          <Key className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
          API Keys
        </h2>
        <p className="text-sm text-muted-foreground mb-6">Configure API keys.</p>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading keys...</div>
        ) : (
          <>
            <div className="mb-6 p-4 rounded-xl border border-border bg-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-foreground">AI API Key</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showAiKey ? "text" : "password"}
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    placeholder="Enter key"
                    className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAiKey(!showAiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSaveAiKey}
                  disabled={!aiKey.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {aiSaved ? <Check className="w-4 h-4" /> : null}
                  {aiSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-xl border border-border bg-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">OpenAI API Key</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Image Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showOpenai ? "text" : "password"}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="Enter key"
                    className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenai(!showOpenai)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSaveOpenai}
                  disabled={!openaiKey.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {openaiSaved ? <Check className="w-4 h-4" /> : null}
                  {openaiSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-sm font-semibold text-foreground">Deepseek API Key</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Sales Wizard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showDeepseek ? "text" : "password"}
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder="Enter key"
                    className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeepseek(!showDeepseek)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showDeepseek ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSaveDeepseek}
                  disabled={!deepseekKey.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {deepseekSaved ? <Check className="w-4 h-4" /> : null}
                  {deepseekSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">Keys are stored in the database.</p>
            </div>
          </>
        )}
      </div>

      {/* AI Support Settings */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5 mb-1">
          <MessageSquare className="w-5 h-5 text-purple-500 stroke-[1.5]" />
          AI Support Chat
        </h2>
        <p className="text-sm text-muted-foreground mb-6">Configure the AI assistant that replies to users when you're offline.</p>

        <AISupportSettings />
      </div>
    </div>
  );
}

function AISupportSettings() {
  const [enabled, setEnabled] = useState(false);
  const [aiName, setAiName] = useState("Maya");
  const [personality, setPersonality] = useState("friendly and helpful");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [enabledRes, nameRes, personalityRes] = await Promise.all([
        supabase.from("settings").select("value").eq("key", "ai_support_enabled").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "ai_support_name").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "ai_support_personality").maybeSingle(),
      ]);
      if (cancelled) return;
      setEnabled((enabledRes.data as any)?.value === "true");
      setAiName((nameRes.data as any)?.value || "Maya");
      setPersonality((personalityRes.data as any)?.value || "friendly and helpful");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    const upsertKey = async (key: string, value: string) => {
      await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    };
    await Promise.all([
      upsertKey("ai_support_enabled", enabled ? "true" : "false"),
      upsertKey("ai_support_name", aiName.trim()),
      upsertKey("ai_support_personality", personality.trim()),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-accent/30">
        <div>
          <p className="text-sm font-semibold text-foreground">Enable AI Auto-Reply</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            When enabled, the AI will automatically respond to user messages when you're not available.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enabled ? "bg-purple-600" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
              enabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* AI Name */}
      <div className="p-4 rounded-xl border border-border bg-accent/30">
        <label className="text-sm font-semibold text-foreground block mb-1">AI Name</label>
        <p className="text-xs text-muted-foreground mb-2">This is how the AI will introduce itself to users.</p>
        <input
          type="text"
          value={aiName}
          onChange={(e) => setAiName(e.target.value)}
          placeholder="e.g. Maya, Alex, SupportBot"
          className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Personality */}
      <div className="p-4 rounded-xl border border-border bg-accent/30">
        <label className="text-sm font-semibold text-foreground block mb-1">Personality</label>
        <p className="text-xs text-muted-foreground mb-2">Describe how the AI should behave (e.g. friendly, professional, casual).</p>
        <input
          type="text"
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          placeholder="e.g. friendly and helpful, professional and concise"
          className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Escalation Note */}
      <div className="p-4 rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">How it works</p>
            <ul className="text-xs text-purple-700 dark:text-purple-400 mt-1 space-y-1 list-disc list-inside">
              <li>When a user sends a message, the AI responds automatically</li>
              <li>The AI uses the name and personality you set above</li>
              <li>If the AI can't answer or it's an escalation, it tells the user someone will follow up within 12 hours</li>
              <li>You can still see and reply to all conversations in the Support Inbox</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center gap-1.5"
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

function AdminAssetManager() {
  const [users, setUsers] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [packageType, setPackageType] = useState<"pro" | "pro_plus">("pro");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });
      setUsers(data || []);
    })();
  }, []);

  const loadUserAssets = useCallback(async (userId: string) => {
    if (!userId) return;
    setLoadingAssets(true);
    const { data } = await supabase
      .from("user_assets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setAssets(data || []);
    setLoadingAssets(false);
  }, []);

  useEffect(() => {
    if (selectedUserId) loadUserAssets(selectedUserId);
    else setAssets([]);
  }, [selectedUserId, loadUserAssets]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedUserId || files.length === 0) return;
    setUploading(true);
    setErrors([]);
    setUploaded([]);

    const uploadedNames: string[] = [];
    const errorMessages: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${selectedUserId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const fileType = file.type.startsWith("video/") ? "video" : "image";

      // Upload to storage (private bucket, user's folder)
      const { error: uploadError } = await supabase.storage
        .from("user_assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        errorMessages.push(`${file.name}: ${uploadError.message}`);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("user_assets")
        .getPublicUrl(fileName);

      // Insert record in user_assets table
      const { error: dbError } = await supabase.from("user_assets").insert({
        user_id: selectedUserId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.type,
        package_type: packageType,
      });

      if (dbError) {
        errorMessages.push(`${file.name}: ${dbError.message}`);
      } else {
        uploadedNames.push(file.name);
      }
    }

    setUploaded(uploadedNames);
    setErrors(errorMessages);
    setFiles([]);
    setUploading(false);
    if (selectedUserId) loadUserAssets(selectedUserId);
  };

  const handleDelete = async (assetId: string, fileName: string) => {
    setDeleting(assetId);
    // Delete from storage
    const storagePath = `${selectedUserId}/${fileName.split("/").pop()}`;
    await supabase.storage.from("user_assets").remove([storagePath]);
    // Delete from DB
    await supabase.from("user_assets").delete().eq("id", assetId);
    setDeleting(null);
    if (selectedUserId) loadUserAssets(selectedUserId);
  };

  return (
    <div className="space-y-6">
      {/* Select User */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5 mb-4">
          <Package className="w-5 h-5 text-emerald-500 stroke-[1.5]" />
          Upload Assets for a User
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">— Choose a user —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email || u.full_name || u.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Package Type</label>
            <select
              value={packageType}
              onChange={(e) => setPackageType(e.target.value as "pro" | "pro_plus")}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="pro">Pro</option>
              <option value="pro_plus">Pro Plus</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedUserId}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Select Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-4 p-4 bg-accent/30 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">{files.length} file(s) selected</span>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Upload to User</>
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border text-xs">
                  {file.type.startsWith("video/") ? <Film className="w-3.5 h-3.5 text-rose-500" /> : <ImageIcon className="w-3.5 h-3.5 text-amber-500" />}
                  <span className="text-foreground truncate max-w-[150px]">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploaded.length > 0 && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-800">{uploaded.length} file(s) uploaded</p>
              <ul className="mt-0.5 text-[11px] text-emerald-700">{uploaded.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-800">Errors</p>
              <ul className="mt-0.5 text-[11px] text-red-700">{errors.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          </div>
        )}
      </div>

      {/* User's Assets */}
      {selectedUserId && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
              <Package className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
              User's Assets
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {assets.length} file(s)
              </span>
            </h2>
            <button
              onClick={() => loadUserAssets(selectedUserId)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
            >
              Refresh
            </button>
          </div>

          {loadingAssets ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading assets...</div>
          ) : assets.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-xl">
              No assets for this user yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {assets.map((asset: any) => (
                <div key={asset.id} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border">
                  {asset.file_type === "video" ? (
                    <video src={asset.file_url} className="w-full h-full object-cover" preload="metadata" />
                  ) : (
                    <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute top-1.5 left-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${asset.package_type === "pro_plus" ? "bg-rose-500" : "bg-amber-500"}`}>
                      {asset.package_type === "pro_plus" ? "Pro+" : "Pro"}
                    </span>
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={asset.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-700 hover:bg-white"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(asset.id, asset.file_url)}
                      disabled={deleting === asset.id}
                      className="w-7 h-7 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                    >
                      {deleting === asset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    <p className="text-[9px] text-white truncate font-medium">{asset.file_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PLAN_OPTIONS = [
  { value: "free", label: "Free", icon: Sparkles },
  { value: "pro", label: "Pro", icon: Crown },
  { value: "pro_plus", label: "Pro Plus", icon: Crown },
  { value: "vip", label: "VIP", icon: Star },
] as const;

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<"dashboard" | "users" | "assets" | "support" | "settings" | "downloads" | "bms" | "gcash" | "affiliates">("dashboard");
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [users, setUsers] = useState<ProfileRow[]>([]);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({});

  const loadUsers = async (mode: "reset" | "more") => {
    setUsersError(null);
    setLoadingUsers(true);

    const limit = 50;
    const nextCursor = mode === "more" ? cursor : null;

    let q = supabase
      .from("profiles")
      .select("id,email,full_name,is_admin,plan,is_active,activated_at,created_at,email_confirmed_at")
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (nextCursor) {
      q = q.lt("id", nextCursor);
    }

    const { data, error } = await q;

    if (error) {
      setUsersError(error.message);
      setLoadingUsers(false);
      return;
    }

    const rows = (data ?? []) as ProfileRow[];
    const more = rows.length > limit;
    const sliced = more ? rows.slice(0, limit) : rows;
    const newCursor = sliced.length ? sliced[sliced.length - 1].id : null;

    setHasMore(more);
    setCursor(newCursor);

    setUsers((prev) => (mode === "reset" ? sliced : [...prev, ...sliced]));
    setLoadingUsers(false);

    // Fetch active subscriptions for these users
    const userIds = sliced.map((u) => u.id);
    if (userIds.length > 0) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .in("user_id", userIds)
        .eq("status", "active");
      if (subs) {
        const subMap: Record<string, any> = {};
        subs.forEach((s) => {
          subMap[s.user_id] = s;
        });
        setSubscriptions((prev) => ({ ...prev, ...subMap }));
      }
    }
  };

  const [planHistory, setPlanHistory] = useState<PlanHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async (userId: string) => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("plan_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) setPlanHistory((data ?? []) as PlanHistoryRow[]);
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadUsers("reset");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.isAdmin]);

  useEffect(() => {
    if (historyUserId) loadHistory(historyUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyUserId]);

  const planBadge = useMemo(() => {
    return (plan: string) => {
      if (plan === "vip") return "bg-purple-50 text-purple-700 border-purple-200";
      if (plan === "pro") return "bg-amber-50 text-amber-700 border-amber-200";
      if (plan === "pro_plus") return "bg-rose-50 text-rose-700 border-rose-200";
      return "bg-slate-100 text-slate-700 border-slate-200";
    };
  }, []);

  const totalUsers = users.length;

  const setPlan = async (userId: string, plan: "free" | "pro" | "pro_plus" | "vip") => {
    const { data: current } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
    const previousPlan = (current as any)?.plan ?? "free";
    await supabase
      .from("profiles")
      .update({ plan, activated_at: new Date().toISOString(), is_active: true })
      .eq("id", userId);

    await supabase.from("plan_history").insert({
      user_id: userId,
      plan,
      previous_plan: previousPlan,
      set_by: user?.email ?? "Admin",
      notes: "",
      created_at: new Date().toISOString(),
    } as any);

    // Create subscription + invoice for paid plans
    const paidPlans = ["pro", "pro_plus", "vip"];
    if (paidPlans.includes(plan)) {
      const planPrices: Record<string, number> = { pro: 499, pro_plus: 999, vip: 1999 };
      const price = planPrices[plan] || 0;
      await supabase.rpc("create_subscription_with_invoice", {
        p_user_id: userId,
        p_plan: plan,
        p_amount: price,
      });
    }

    // Auto-create affiliate commission if this is a paid plan upgrade
    if (paidPlans.includes(plan) && previousPlan === "free") {
      const planPrices: Record<string, number> = { pro: 499, pro_plus: 999, vip: 1999 };
      const price = planPrices[plan] || 0;
      const commissionAmount = Math.round(price * 0.3 * 100) / 100; // 30%

      // Check if user was referred
      const { data: referral } = await supabase
        .from("affiliate_referrals")
        .select("id, affiliate_id")
        .eq("referred_user_id", userId)
        .maybeSingle();

      if (referral) {
        // Mark referral as active
        await supabase
          .from("affiliate_referrals")
          .update({ status: "active" })
          .eq("id", referral.id);

        // Create commission
        await supabase.from("affiliate_commissions").insert({
          affiliate_id: referral.affiliate_id,
          referral_id: referral.id,
          amount: commissionAmount,
          commission_rate: 30.00,
          plan,
          status: "pending",
          period_start: new Date().toISOString().split("T")[0],
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        });

        // Update affiliate pending balance
        await supabase.rpc("add_affiliate_commission_balance", {
          p_affiliate_id: referral.affiliate_id,
          p_amount: commissionAmount,
        });
      }
    }

    trackEvent("CompleteRegistration", {
      plan,
      previous_plan: previousPlan,
      user_id: userId,
      currency: "PHP",
      value: plan === "pro" ? 499 : plan === "pro_plus" ? 999 : 0,
    });

    await loadUsers("reset");
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    await supabase
      .from("profiles")
      .update({ is_active: isActive, activated_at: isActive ? new Date().toISOString() : null })
      .eq("id", userId);
    await loadUsers("reset");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Admin access required.</p>
          <button onClick={() => navigate("/app")} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm font-semibold">
            Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage users and plans.</p>
        </div>

        <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-border w-fit mb-8">
          <button
            onClick={() => setActiveSection("dashboard")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "dashboard" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Activity className="w-4 h-4 stroke-[1.5]" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveSection("users")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "users" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Users className="w-4 h-4 stroke-[1.5]" />
            Users
          </button>
          <button
            onClick={() => setActiveSection("assets")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "assets" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Package className="w-4 h-4 stroke-[1.5]" />
            Assets
          </button>
          <button
            onClick={() => setActiveSection("support")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "support" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <MessageSquare className="w-4 h-4 stroke-[1.5]" />
            Support
          </button>
          <button
            onClick={() => setActiveSection("downloads")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "downloads" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Download className="w-4 h-4 stroke-[1.5]" />
            Downloads
          </button>
          <button
            onClick={() => setActiveSection("bms")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "bms" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Building2 className="w-4 h-4 stroke-[1.5]" />
            BMS Access
          </button>
          <button
            onClick={() => setActiveSection("gcash")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "gcash" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Smartphone className="w-4 h-4 stroke-[1.5]" />
            GCash Access
          </button>
          <button
            onClick={() => setActiveSection("affiliates")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "affiliates" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Gift className="w-4 h-4 stroke-[1.5]" />
            Affiliates
          </button>
          <button
            onClick={() => setActiveSection("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "settings" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Settings className="w-4 h-4 stroke-[1.5]" />
            Settings
          </button>
        </div>

        {activeSection === "dashboard" && <AdminDashboard />}

        {activeSection === "users" && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
                <Users className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
                Registered Users
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-medium">{totalUsers} loaded</span>
                <button
                  onClick={() => loadUsers("reset")}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
                >
                  Refresh
                </button>
              </div>
            </div>

            {usersError && <div className="p-4 border-b border-border bg-red-50 text-red-700 text-sm">{usersError}</div>}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Confirmed</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Billing</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{u.full_name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{u.email ?? ""}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            u.email_confirmed_at
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {u.email_confirmed_at ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {u.email_confirmed_at ? "Confirmed" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            u.is_admin ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.is_admin ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {u.is_admin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select
                            value={u.plan || "free"}
                            onChange={(e) => setPlan(u.id, e.target.value as any)}
                            className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-ring ${planBadge(u.plan)}`}
                          >
                            {PLAN_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <svg className="w-3 h-3 text-current opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {subscriptions[u.id] ? (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Next:</span>
                            <span className="font-medium ml-1">
                              {new Date(subscriptions[u.id].next_billing_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                            </span>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {formatCurrency(subscriptions[u.id].amount)}/mo
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {subscriptions[u.id] ? (
                          <button
                            onClick={() => navigate(`/app/billing?userId=${u.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            u.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {u.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActive(u.id, !u.is_active)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              u.is_active
                                ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                            }`}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => setHistoryUserId(u.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5"
                          >
                            <History className="w-3 h-3" />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {loadingUsers && (
                    <tr>
                      <td colSpan={9} className="px-6 py-6 text-sm text-muted-foreground">
                        Loading users...
                      </td>
                    </tr>
                  )}

                  {!loadingUsers && users.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-xs text-muted-foreground">Showing {users.length} users</div>
              <button
                disabled={!hasMore || loadingUsers}
                onClick={() => loadUsers("more")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load more
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {historyUserId && (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/30" onClick={() => setHistoryUserId(null)} />
                <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-semibold text-slate-900">Plan History</h3>
                    </div>
                    <button className="p-2 rounded-xl hover:bg-slate-100" onClick={() => setHistoryUserId(null)} aria-label="Close">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {loadingHistory ? (
                      <div className="text-sm text-slate-500">Loading history…</div>
                    ) : (
                      (planHistory ?? []).map((h) => (
                        <div key={h.id} className="rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">{h.plan}</div>
                            <div className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString()}</div>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">Previous: {h.previous_plan || "—"}</div>
                          <div className="text-xs text-slate-600">Set by: {h.set_by || "—"}</div>
                        </div>
                      ))
                    )}
                    {!loadingHistory && (planHistory?.length ?? 0) === 0 && <div className="text-sm text-slate-500">No plan changes yet.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "assets" && <AdminAssetManager />}

        {activeSection === "support" && <AdminSupportInbox />}

        {activeSection === "downloads" && <AdminDownloads />}

        {activeSection === "bms" && <AdminBMSAccess />}

        {activeSection === "gcash" && <AdminGCashAccess />}

        {activeSection === "affiliates" && <AdminAffiliates />}

        {activeSection === "settings" && <ApiKeySettings />}
      </div>
    </div>
  );
}
