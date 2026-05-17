import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import {
  Smartphone, Banknote, ArrowUpCircle, ArrowDownCircle,
  Search, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  History, CheckCheck, CreditCard, Clock, Trash2
} from 'lucide-react';
import { TableSkeleton } from '@/components/BusinessSkeleton';
import ExportButton from '@/components/ExportButton';
import { NewTransactionDialog, ReplenishDialog, ReconciliationDialog } from '@/components/GCashDialogs';

interface GcashTransaction {
  id: string;
  transaction_type: 'cash_in' | 'cash_out' | 'float_replenish' | 'transfer';
  amount: number;
  fee: number;
  net_amount: number;
  reference_number: string | null;
  verified: boolean;
  payment_status: 'paid' | 'unpaid';
  customer_name: string | null;
  notes: string | null;
  transaction_date: string;
  created_at: string;
}

interface Reconciliation {
  id: string;
  snapshot_date: string;
  digital_wallet_balance: number;
  physical_cash_drawer: number;
  expected_digital_balance: number | null;
  expected_cash_balance: number | null;
  digital_variance: number | null;
  cash_variance: number | null;
  status: 'balanced' | 'short' | 'over' | 'unchecked';
  notes: string | null;
  created_at: string;
}

const TRANSACTION_TYPES = [
  { value: 'cash_in', label: 'Cash In', icon: ArrowDownCircle, color: 'text-emerald-600' },
  { value: 'cash_out', label: 'Cash Out', icon: ArrowUpCircle, color: 'text-rose-600' },
  { value: 'float_replenish', label: 'Float Replenish', icon: RefreshCw, color: 'text-blue-600' },
  { value: 'transfer', label: 'Transfer', icon: CreditCard, color: 'text-purple-600' },
];

export default function BusinessGCash() {
  const { user } = useAuth();

  // Only VIP, Pro, and Pro+ users can access GCash
  if (user && user.plan === 'free') {
    return <Navigate to="/app" replace />;
  }

  const [transactions, setTransactions] = useState<GcashTransaction[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [reconDialogOpen, setReconDialogOpen] = useState(false);
  const [replenishDialogOpen, setReplenishDialogOpen] = useState(false);
  const [searchRef, setSearchRef] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [form, setForm] = useState({
    transaction_type: 'cash_in' as string,
    amount: '', fee: '0', reference_number: '',
    customer_name: '', payment_status: 'paid' as 'paid' | 'unpaid',
    notes: '', transaction_date: new Date().toISOString().split('T')[0],
  });
  const [reconForm, setReconForm] = useState({
    digital_wallet_balance: '', physical_cash_drawer: '', notes: '',
  });
  const [replenishForm, setReplenishForm] = useState({
    amount: '', fee: '', reference_number: '', notes: '',
  });

  const ownerId = user?.id;

  const fetchData = useCallback(async () => {
    if (!ownerId) return;
    const [txRes, reconRes] = await Promise.all([
      supabase.from('gcash_transactions').select('*').eq('user_id', ownerId)
        .gte('transaction_date', dateRange.from).lte('transaction_date', dateRange.to)
        .order('transaction_date', { ascending: false }),
      supabase.from('gcash_reconciliation').select('*').eq('user_id', ownerId)
        .order('snapshot_date', { ascending: false }).limit(30),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (reconRes.data) setReconciliations(reconRes.data);
    setLoading(false);
  }, [ownerId, dateRange]);

  useEffect(() => { if (ownerId) fetchData(); }, [ownerId, fetchData]);

  const totalCashIn = transactions.filter(t => t.transaction_type === 'cash_in').reduce((s, t) => s + t.amount, 0);
  const totalCashOut = transactions.filter(t => t.transaction_type === 'cash_out').reduce((s, t) => s + t.amount, 0);
  const totalFees = transactions.reduce((s, t) => s + (t.fee || 0), 0);
  const totalReplenish = transactions.filter(t => t.transaction_type === 'float_replenish').reduce((s, t) => s + t.amount, 0);
  const unpaidTotal = transactions.filter(t => t.payment_status === 'unpaid').reduce((s, t) => s + t.amount, 0);
  const latestRecon = reconciliations[0];

  const filteredTransactions = transactions.filter(t => {
    if (searchRef && !t.reference_number?.toLowerCase().includes(searchRef.toLowerCase())) return false;
    if (statusFilter !== 'all' && t.payment_status !== statusFilter) return false;
    return true;
  });

  async function handleSaveTransaction() {
    if (!form.amount) { toast.error('Amount is required'); return; }
    const amount = parseFloat(form.amount);
    const fee = parseFloat(form.fee) || 0;
    const netAmount = form.transaction_type === 'cash_in' ? amount - fee : amount + fee;
    const { error } = await supabase.from('gcash_transactions').insert({
      user_id: ownerId, transaction_type: form.transaction_type, amount, fee,
      net_amount: netAmount, reference_number: form.reference_number || null,
      customer_name: form.customer_name || null, payment_status: form.payment_status,
      notes: form.notes || null, transaction_date: form.transaction_date,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Transaction recorded!');
    setTxDialogOpen(false);
    setForm({ transaction_type: 'cash_in', amount: '', fee: '0', reference_number: '', customer_name: '', payment_status: 'paid', notes: '', transaction_date: new Date().toISOString().split('T')[0] });
    fetchData();
  }

  async function handleSaveReconciliation() {
    if (!reconForm.digital_wallet_balance || !reconForm.physical_cash_drawer) {
      toast.error('Both balances are required'); return;
    }
    const digitalBalance = parseFloat(reconForm.digital_wallet_balance);
    const cashDrawer = parseFloat(reconForm.physical_cash_drawer);
    const today = new Date().toISOString().split('T')[0];
    const todayTx = transactions.filter(t => t.transaction_date === today);
    const todayCashIn = todayTx.filter(t => t.transaction_type === 'cash_in').reduce((s, t) => s + t.amount, 0);
    const todayCashOut = todayTx.filter(t => t.transaction_type === 'cash_out').reduce((s, t) => s + t.amount, 0);
    const todayReplenish = todayTx.filter(t => t.transaction_type === 'float_replenish').reduce((s, t) => s + t.amount, 0);
    const todayFees = todayTx.reduce((s, t) => s + (t.fee || 0), 0);
    const prevDigital = latestRecon?.digital_wallet_balance || 0;
    const expectedDigital = prevDigital + todayCashOut - todayCashIn + todayReplenish - todayFees;
    const digitalVariance = digitalBalance - expectedDigital;
    const prevCash = latestRecon?.physical_cash_drawer || 0;
    const expectedCash = prevCash + todayCashIn - todayCashOut - todayReplenish;
    const cashVariance = cashDrawer - expectedCash;
    let status: 'balanced' | 'short' | 'over' = 'balanced';
    if (Math.abs(digitalVariance) > 0.01 || Math.abs(cashVariance) > 0.01) {
      status = (digitalVariance < -0.01 || cashVariance < -0.01) ? 'short' : 'over';
    }
    const { error } = await supabase.from('gcash_reconciliation').insert({
      user_id: ownerId, snapshot_date: today, digital_wallet_balance: digitalBalance,
      physical_cash_drawer: cashDrawer, expected_digital_balance: expectedDigital,
      expected_cash_balance: expectedCash, digital_variance: digitalVariance,
      cash_variance: cashVariance, status, notes: reconForm.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Reconciliation saved — Status: ${status.toUpperCase()}`);
    setReconDialogOpen(false);
    setReconForm({ digital_wallet_balance: '', physical_cash_drawer: '', notes: '' });
    fetchData();
  }

  async function handleSaveReplenish() {
    if (!replenishForm.amount) { toast.error('Amount is required'); return; }
    const amount = parseFloat(replenishForm.amount);
    const fee = parseFloat(replenishForm.fee) || 0;
    const { error } = await supabase.from('gcash_transactions').insert({
      user_id: ownerId, transaction_type: 'float_replenish', amount, fee,
      net_amount: amount + fee, reference_number: replenishForm.reference_number || null,
      notes: replenishForm.notes || null, transaction_date: new Date().toISOString().split('T')[0],
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Float replenishment logged!');
    setReplenishDialogOpen(false);
    setReplenishForm({ amount: '', fee: '', reference_number: '', notes: '' });
    fetchData();
  }

  async function toggleVerified(id: string, current: boolean) {
    const { error } = await supabase.from('gcash_transactions').update({ verified: !current }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(current ? 'Unverified' : 'Verified');
    fetchData();
  }

  async function togglePaymentStatus(id: string, current: string) {
    const newStatus = current === 'paid' ? 'unpaid' : 'paid';
    const { error } = await supabase.from('gcash_transactions').update({ payment_status: newStatus }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${newStatus}`);
    fetchData();
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from('gcash_transactions').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Transaction deleted');
    fetchData();
  }

  const getTypeBadge = (type: string) => {
    const t = TRANSACTION_TYPES.find(x => x.value === type);
    if (!t) return <Badge variant="outline">{type}</Badge>;
    const Icon = t.icon;
    return (
      <Badge variant="outline" className={`gap-1.5 ${t.color}`}>
        <Icon className="w-3 h-3" /> {t.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">GCash Cash In/Out</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor digital wallet, physical cash, and transaction logs</p>
      </div>

      {/* Dual-Balance Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-green-700 dark:text-green-400">Digital Wallet</CardTitle>
            <Smartphone className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-800 dark:text-green-300">
              {latestRecon ? formatCurrency(latestRecon.digital_wallet_balance) : '—'}
            </p>
            <p className="text-[10px] text-green-600/60 mt-0.5">
              Last reconciled: {latestRecon ? new Date(latestRecon.snapshot_date).toLocaleDateString() : 'Never'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">Cash in Drawer</CardTitle>
            <Banknote className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-amber-800 dark:text-amber-300">
              {latestRecon ? formatCurrency(latestRecon.physical_cash_drawer) : '—'}
            </p>
            <p className="text-[10px] text-amber-600/60 mt-0.5">Physical cash on hand</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Cash In (Period)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalCashIn)}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{transactions.filter(t => t.transaction_type === 'cash_in').length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Cash Out (Period)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-rose-700">{formatCurrency(totalCashOut)}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{transactions.filter(t => t.transaction_type === 'cash_out').length} transactions</p>
          </CardContent>
        </Card>
        <Card className={`bg-gradient-to-br ${unpaidTotal > 0 ? 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200' : 'from-gray-50 to-slate-50'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Unpaid (Utang)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${unpaidTotal > 0 ? 'text-red-700' : 'text-muted-foreground'}`}>{formatCurrency(unpaidTotal)}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{transactions.filter(t => t.payment_status === 'unpaid').length} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Reconciliation Status */}
      {latestRecon && (
        <Card className={`mb-6 border-2 ${
          latestRecon.status === 'balanced' ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/10' :
          latestRecon.status === 'short' ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/10' :
          latestRecon.status === 'over' ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/10' :
          'border-gray-200 dark:border-gray-700'
        }`}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {latestRecon.status === 'balanced' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : latestRecon.status === 'short' ? (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                ) : latestRecon.status === 'over' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                ) : (
                  <Clock className="w-6 h-6 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-bold capitalize">
                    {latestRecon.status === 'balanced' ? '✅ Balanced' :
                     latestRecon.status === 'short' ? '⚠️ Short' :
                     latestRecon.status === 'over' ? '⚠️ Over' : 'Unchecked'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(latestRecon.snapshot_date).toLocaleDateString()} — 
                    Digital variance: {formatCurrency(latestRecon.digital_variance || 0)} | 
                    Cash variance: {formatCurrency(latestRecon.cash_variance || 0)}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setReconDialogOpen(true)} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> New Reconciliation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions" className="gap-2">
            <History className="w-4 h-4" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-2">
            <CheckCheck className="w-4 h-4" /> Reconciliation History
          </TabsTrigger>
        </TabsList>

        {/* TRANSACTIONS TAB */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle>Transaction Log</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Search ref #..." value={searchRef}
                    onChange={e => setSearchRef(e.target.value)} className="pl-9 w-[160px] h-9 text-sm" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={dateRange.from} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))} className="w-[130px] h-9" />
                <Input type="date" value={dateRange.to} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))} className="w-[130px] h-9" />
                <ExportButton
                  data={filteredTransactions} filename="gcash-transactions" title="GCash Transactions"
                  columns={[
                    { key: 'transaction_date', header: 'Date', formatter: v => new Date(v).toLocaleDateString() },
                    { key: 'transaction_type', header: 'Type' },
                    { key: 'amount', header: 'Amount', formatter: v => `₱${v.toFixed(2)}` },
                    { key: 'fee', header: 'Fee', formatter: v => `₱${v.toFixed(2)}` },
                    { key: 'net_amount', header: 'Net', formatter: v => `₱${v.toFixed(2)}` },
                    { key: 'reference_number', header: 'Ref #', formatter: v => v || '—' },
                    { key: 'customer_name', header: 'Customer', formatter: v => v || '—' },
                    { key: 'payment_status', header: 'Payment' },
                    { key: 'verified', header: 'Verified', formatter: v => v ? 'Yes' : 'No' },
                  ]}
                />
                <ReplenishDialog
                  open={replenishDialogOpen} onOpenChange={setReplenishDialogOpen}
                  form={replenishForm} setForm={setReplenishForm} onSave={handleSaveReplenish}
                />
                <NewTransactionDialog
                  open={txDialogOpen} onOpenChange={setTxDialogOpen}
                  form={form} setForm={setForm} onSave={handleSaveTransaction}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} />
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No transactions found</p>
                  {searchRef && <p className="text-xs mt-1">Try a different reference number</p>}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Fee</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead>Ref #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map(tx => (
                        <TableRow key={tx.id} className={tx.payment_status === 'unpaid' ? 'bg-red-50/40 dark:bg-red-950/10' : ''}>
                          <TableCell className="text-xs whitespace-nowrap">{new Date(tx.transaction_date).toLocaleDateString()}</TableCell>
                          <TableCell>{getTypeBadge(tx.transaction_type)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs">{tx.fee ? formatCurrency(tx.fee) : '—'}</TableCell>
                          <TableCell className="text-right text-xs">{tx.net_amount ? formatCurrency(tx.net_amount) : '—'}</TableCell>
                          <TableCell>
                            {tx.reference_number ? (
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{tx.reference_number}</code>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell className="text-xs">{tx.customer_name || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={tx.payment_status === 'paid' ? 'default' : 'destructive'}
                              className="gap-1 text-xs cursor-pointer"
                              onClick={() => togglePaymentStatus(tx.id, tx.payment_status)}>
                              {tx.payment_status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {tx.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button onClick={() => toggleVerified(tx.id, tx.verified)}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                tx.verified
                                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400'
                                  : 'bg-muted border-border text-muted-foreground hover:border-green-300'
                              }`}>
                              {tx.verified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {tx.verified ? 'Verified' : 'Verify'}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <button onClick={() => deleteTransaction(tx.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECONCILIATION TAB */}
        <TabsContent value="reconciliation">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle>End-of-Day Reconciliation</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setReconDialogOpen(true)} className="gap-2">
                <RefreshCw className="w-4 h-4" /> New Reconciliation
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={3} />
              ) : reconciliations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No reconciliations yet</p>
                  <p className="text-xs mt-1">Click "New Reconciliation" to do your first end-of-day check</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Digital Wallet</TableHead>
                        <TableHead className="text-right">Cash Drawer</TableHead>
                        <TableHead className="text-right">Expected Digital</TableHead>
                        <TableHead className="text-right">Expected Cash</TableHead>
                        <TableHead className="text-right">Digital Var.</TableHead>
                        <TableHead className="text-right">Cash Var.</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reconciliations.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs whitespace-nowrap">{new Date(r.snapshot_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              r.status === 'balanced' ? 'default' :
                              r.status === 'short' ? 'destructive' : 'secondary'
                            } className="gap-1 text-xs">
                              {r.status === 'balanced' ? <CheckCircle2 className="w-3 h-3" /> :
                               r.status === 'short' ? <AlertTriangle className="w-3 h-3" /> :
                               <AlertTriangle className="w-3 h-3" />}
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(r.digital_wallet_balance)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(r.physical_cash_drawer)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{r.expected_digital_balance ? formatCurrency(r.expected_digital_balance) : '—'}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{r.expected_cash_balance ? formatCurrency(r.expected_cash_balance) : '—'}</TableCell>
                          <TableCell className={`text-right ${(r.digital_variance || 0) < 0 ? 'text-red-600' : (r.digital_variance || 0) > 0 ? 'text-amber-600' : ''}`}>
                            {r.digital_variance !== null ? formatCurrency(r.digital_variance) : '—'}
                          </TableCell>
                          <TableCell className={`text-right ${(r.cash_variance || 0) < 0 ? 'text-red-600' : (r.cash_variance || 0) > 0 ? 'text-amber-600' : ''}`}>
                            {r.cash_variance !== null ? formatCurrency(r.cash_variance) : '—'}
                          </TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{r.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reconciliation Dialog */}
      <ReconciliationDialog
        open={reconDialogOpen} onOpenChange={setReconDialogOpen}
        form={reconForm} setForm={setReconForm} onSave={handleSaveReconciliation}
      />
    </div>
  );
}
