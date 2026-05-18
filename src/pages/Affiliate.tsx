import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/providers/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import {
  Gift, Users, DollarSign, Wallet, Copy, CheckCircle2,
  Clock, ArrowUpRight, Banknote, Smartphone, Loader2,
  ChevronRight, ExternalLink, AlertCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Affiliate = {
  id: string;
  user_id: string;
  referral_code: string;
  gcash_name: string | null;
  gcash_number: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  total_earned: number;
  total_paid_out: number;
  pending_balance: number;
  is_active: boolean;
};

type Referral = {
  id: string;
  referred_email: string | null;
  status: string;
  created_at: string;
};

type Commission = {
  id: string;
  amount: number;
  commission_rate: number;
  plan: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
};

type Payout = {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
};

export default function Affiliate() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [copied, setCopied] = useState(false);

  // Payout request form
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"gcash" | "bank">("gcash");
  const [payoutGcashName, setPayoutGcashName] = useState("");
  const [payoutGcashNumber, setPayoutGcashNumber] = useState("");
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutBankAccountName, setPayoutBankAccountName] = useState("");
  const [payoutBankAccountNumber, setPayoutBankAccountNumber] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Join affiliate form
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get affiliate record
    const { data: affData } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setAffiliate(affData as Affiliate | null);

    if (affData) {
      // Get referrals
      const { data: refData } = await supabase
        .from("affiliate_referrals")
        .select("*")
        .eq("affiliate_id", affData.id)
        .order("created_at", { ascending: false });

      setReferrals(refData as Referral[] || []);

      // Get commissions
      const { data: commData } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", affData.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setCommissions(commData as Commission[] || []);

      // Get payouts
      const { data: payoutData } = await supabase
        .from("affiliate_payouts")
        .select("*")
        .eq("affiliate_id", affData.id)
        .order("created_at", { ascending: false });

      setPayouts(payoutData as Payout[] || []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoin = async () => {
    if (!joinCode.trim()) { toast.error("Enter a referral code"); return; }
    if (!user) return;
    setJoining(true);

    // Check if code is taken
    const { data: existing } = await supabase
      .from("affiliates")
      .select("id")
      .eq("referral_code", joinCode.trim().toUpperCase())
      .maybeSingle();

    if (existing) {
      toast.error("That referral code is already taken. Try another.");
      setJoining(false);
      return;
    }

    const { error } = await supabase.from("affiliates").insert({
      user_id: user.id,
      referral_code: joinCode.trim().toUpperCase(),
    });

    if (error) {
      toast.error(error.message);
      setJoining(false);
      return;
    }

    toast.success("You're now an affiliate! 🎉");
    setJoinOpen(false);
    fetchData();
    setJoining(false);
  };

  const handleCopyCode = () => {
    if (!affiliate) return;
    const link = `${window.location.origin}/auth?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Referral link copied!");
  };

  const handleRequestPayout = async () => {
    if (!affiliate) return;
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (amount > affiliate.pending_balance) { toast.error("Amount exceeds your pending balance"); return; }

    setSubmittingPayout(true);

    const payload: any = {
      affiliate_id: affiliate.id,
      amount,
      payment_method: payoutMethod,
    };

    if (payoutMethod === "gcash") {
      if (!payoutGcashName || !payoutGcashNumber) {
        toast.error("Fill in GCash name and number");
        setSubmittingPayout(false);
        return;
      }
      payload.gcash_name = payoutGcashName;
      payload.gcash_number = payoutGcashNumber;
    } else {
      if (!payoutBankName || !payoutBankAccountName || !payoutBankAccountNumber) {
        toast.error("Fill in bank details");
        setSubmittingPayout(false);
        return;
      }
      payload.bank_name = payoutBankName;
      payload.bank_account_name = payoutBankAccountName;
      payload.bank_account_number = payoutBankAccountNumber;
    }

    const { error } = await supabase.from("affiliate_payouts").insert(payload);

    if (error) {
      toast.error(error.message);
      setSubmittingPayout(false);
      return;
    }

    toast.success("Payout request submitted! We'll process it within 30 days.");
    setPayoutOpen(false);
    setPayoutAmount("");
    fetchData();
    setSubmittingPayout(false);
  };

  const pendingCommissions = commissions.filter(c => c.status === "pending" || c.status === "approved");
  const pendingPayouts = payouts.filter(p => p.status === "pending");

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not an affiliate yet — show join prompt
  if (!affiliate) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Program</h1>
          <p className="text-sm text-muted-foreground mt-1">Earn 30% recurring commission on every subscription you refer</p>
        </div>

        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/10 dark:to-purple-950/10">
          <CardContent className="p-8 text-center">
            <Gift className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
            <h2 className="text-xl font-bold mb-2">Become an Affiliate</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Share your referral link and earn <strong className="text-indigo-600 dark:text-indigo-400">30% recurring commission</strong> on every subscription payment from people you refer. Payouts are available after 30 days via GCash or bank transfer.
            </p>
            <ul className="text-sm text-left space-y-2 mb-6 max-w-sm mx-auto">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>30% recurring commission — earn every month they stay subscribed</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>30-day holding period before payout eligibility</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Payout via GCash or bank transfer (manual process)</span>
              </li>
            </ul>
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Gift className="w-4 h-4" /> Join the Affiliate Program
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-indigo-500" /> Join Affiliate Program
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground -mt-2">
                  Choose a unique referral code. This will be used in your referral link.
                </p>
                <div className="space-y-2">
                  <Label>Your Referral Code *</Label>
                  <Input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. JUAN30"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    Letters, numbers, and underscores only. Will be auto-capitalized.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setJoinOpen(false)}>Cancel</Button>
                  <Button onClick={handleJoin} disabled={joining || !joinCode.trim()}>
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Join Now
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeReferrals = referrals.filter(r => r.status === "active").length;
  const totalCommissions = commissions.reduce((s, c) => s + c.amount, 0);
  const approvedCommissions = commissions.filter(c => c.status === "approved").reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your code: <code className="bg-muted px-2 py-0.5 rounded font-mono text-indigo-600 dark:text-indigo-400 font-bold">{affiliate.referral_code}</code>
          </p>
        </div>
        <Button onClick={handleCopyCode} className="gap-2">
          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Referral Link"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Active Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeReferrals}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{referrals.length} total referred</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" /> Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCommissions)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{commissions.length} commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5" /> Pending Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(affiliate.pending_balance)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{pendingCommissions.length} pending commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5" /> Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(affiliate.total_paid_out)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{payouts.filter(p => p.status === "completed").length} payouts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commissions" className="gap-2">
            <DollarSign className="w-4 h-4" /> Commissions
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-2">
            <Users className="w-4 h-4" /> Referrals
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <Wallet className="w-4 h-4" /> Payouts
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Banknote className="w-4 h-4" /> Payment Settings
          </TabsTrigger>
        </TabsList>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission History</CardTitle>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No commissions yet</p>
                  <p className="text-xs mt-1">Share your referral link to start earning!</p>
                </div>
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
                      {commissions.map(c => (
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
                            } className="text-xs capitalize">
                              {c.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                              {c.status === "approved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {c.status === "paid" && <DollarSign className="w-3 h-3 mr-1" />}
                              {c.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">People You've Referred</CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No referrals yet</p>
                  <p className="text-xs mt-1">Share your referral link to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 font-medium text-muted-foreground">Joined</th>
                        <th className="text-right py-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {referrals.map(r => (
                        <tr key={r.id} className="hover:bg-accent/50">
                          <td className="py-3">{r.referred_email || "—"}</td>
                          <td className="py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                          <td className="py-3 text-right">
                            <Badge variant={
                              r.status === "active" ? "default" :
                              r.status === "cancelled" ? "destructive" : "outline"
                            } className="text-xs capitalize">
                              {r.status === "active" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {r.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                              {r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">Payout History</CardTitle>
              <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" disabled={affiliate.pending_balance < 100}>
                    <Wallet className="w-4 h-4" /> Request Payout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-emerald-500" /> Request Payout
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Your available balance: <strong>{formatCurrency(affiliate.pending_balance)}</strong>. Minimum payout is ₱100.
                  </p>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Amount (₱) *</Label>
                      <Input type="number" step="0.01" value={payoutAmount}
                        onChange={e => setPayoutAmount(e.target.value)}
                        placeholder="e.g. 500" />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method *</Label>
                      <Select value={payoutMethod} onValueChange={v => setPayoutMethod(v as "gcash" | "bank")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gcash"><span className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> GCash</span></SelectItem>
                          <SelectItem value="bank"><span className="flex items-center gap-2"><Banknote className="w-4 h-4" /> Bank Transfer</span></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {payoutMethod === "gcash" ? (
                      <>
                        <div className="space-y-2">
                          <Label>GCash Name *</Label>
                          <Input value={payoutGcashName} onChange={e => setPayoutGcashName(e.target.value)} placeholder="Full name on GCash" />
                        </div>
                        <div className="space-y-2">
                          <Label>GCash Number *</Label>
                          <Input value={payoutGcashNumber} onChange={e => setPayoutGcashNumber(e.target.value)} placeholder="09XX XXX XXXX" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Bank Name *</Label>
                          <Input value={payoutBankName} onChange={e => setPayoutBankName(e.target.value)} placeholder="e.g. BDO, BPI, GCash" />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Name *</Label>
                          <Input value={payoutBankAccountName} onChange={e => setPayoutBankAccountName(e.target.value)} placeholder="Full name on account" />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Number *</Label>
                          <Input value={payoutBankAccountNumber} onChange={e => setPayoutBankAccountNumber(e.target.value)} placeholder="Account number" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setPayoutOpen(false)}>Cancel</Button>
                    <Button onClick={handleRequestPayout} disabled={submittingPayout}>
                      {submittingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Submit Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No payout requests yet</p>
                  <p className="text-xs mt-1">Request a payout when your balance reaches at least ₱100</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 font-medium text-muted-foreground">Method</th>
                        <th className="text-right py-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-right py-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payouts.map(p => (
                        <tr key={p.id} className="hover:bg-accent/50">
                          <td className="py-3 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="py-3 capitalize">{p.payment_method}</td>
                          <td className="py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                          <td className="py-3 text-right">
                            <Badge variant={
                              p.status === "completed" ? "default" :
                              p.status === "approved" ? "secondary" :
                              p.status === "rejected" ? "destructive" : "outline"
                            } className="text-xs capitalize">
                              {p.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                              {p.status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {p.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                              {p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Update your default payment details. These will be pre-filled when you request a payout.
              </p>
              <PaymentSettingsForm affiliate={affiliate} onSaved={fetchData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentSettingsForm({ affiliate, onSaved }: { affiliate: Affiliate; onSaved: () => void }) {
  const [gcashName, setGcashName] = useState(affiliate.gcash_name || "");
  const [gcashNumber, setGcashNumber] = useState(affiliate.gcash_number || "");
  const [bankName, setBankName] = useState(affiliate.bank_name || "");
  const [bankAccountName, setBankAccountName] = useState(affiliate.bank_account_name || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(affiliate.bank_account_number || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("affiliates").update({
      gcash_name: gcashName || null,
      gcash_number: gcashNumber || null,
      bank_name: bankName || null,
      bank_account_name: bankAccountName || null,
      bank_account_number: bankAccountNumber || null,
    }).eq("id", affiliate.id);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    toast.success("Payment settings saved!");
    onSaved();
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-500" /> GCash Details
        </h3>
        <div className="space-y-2">
          <Label>GCash Name</Label>
          <Input value={gcashName} onChange={e => setGcashName(e.target.value)} placeholder="Full name on GCash" />
        </div>
        <div className="space-y-2">
          <Label>GCash Number</Label>
          <Input value={gcashNumber} onChange={e => setGcashNumber(e.target.value)} placeholder="09XX XXX XXXX" />
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Banknote className="w-4 h-4 text-blue-500" /> Bank Details
        </h3>
        <div className="space-y-2">
          <Label>Bank Name</Label>
          <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. BDO, BPI" />
        </div>
        <div className="space-y-2">
          <Label>Account Name</Label>
          <Input value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} placeholder="Full name on account" />
        </div>
        <div className="space-y-2">
          <Label>Account Number</Label>
          <Input value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} placeholder="Account number" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Save Payment Settings
      </Button>
    </div>
  );
}
