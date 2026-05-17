import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import { useBusinessTeam } from '@/providers/business-team';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { KPISkeleton, TableSkeleton } from '@/components/BusinessSkeleton';
import ExportButton from '@/components/ExportButton';

interface CashFlowEntry {
  id: string;
  type: 'inflow' | 'outflow';
  category: string;
  description: string | null;
  amount: number;
  entry_date: string;
  notes: string | null;
  created_at: string;
}

const CATEGORIES = ['Sales', 'Investment', 'Loan', 'Refund', 'Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'SSS', 'PhilHealth', 'Pag-IBIG', 'BIR', "Mayor's Permit", 'Other'];

export default function BusinessFinance() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] });
  const [form, setForm] = useState({ type: 'inflow' as 'inflow' | 'outflow', category: 'Sales', description: '', amount: '', entry_date: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => {
    if (user && businessOwnerId) fetchEntries();
  }, [user, businessOwnerId, dateRange]);

  async function fetchEntries() {
    const { data } = await supabase
      .from('cash_flow')
      .select('*')
      .eq('user_id', businessOwnerId!)
      .gte('entry_date', dateRange.from)
      .lte('entry_date', dateRange.to)
      .order('entry_date', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.amount) { toast.error('Amount is required'); return; }
    const { error } = await supabase.from('cash_flow').insert({
      user_id: businessOwnerId!, type: form.type, category: form.category,
      description: form.description || null, amount: parseFloat(form.amount),
      entry_date: form.entry_date, notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Entry recorded!');
    setDialogOpen(false);
    setForm({ type: 'inflow', category: 'Sales', description: '', amount: '', entry_date: new Date().toISOString().split('T')[0], notes: '' });
    fetchEntries();
  }

  const totalInflow = entries.filter(e => e.type === 'inflow').reduce((s, e) => s + e.amount, 0);
  const totalOutflow = entries.filter(e => e.type === 'outflow').reduce((s, e) => s + e.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;

  return (
    <BusinessLayout title="Finance Accounting" description="Track cash flow and financial health">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{entries.length}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Inflow</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{formatCurrency(totalInflow)}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Total Outflow</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-rose-800 dark:text-rose-300">{formatCurrency(totalOutflow)}</p></CardContent>
        </Card>
        <Card className={`bg-gradient-to-br ${netCashFlow >= 0 ? 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200' : 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Cash Flow</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-orange-800 dark:text-orange-300'}`}>
              {formatCurrency(netCashFlow)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>Cash Flow Entries</CardTitle>
          <div className="flex items-center gap-3">
            <Input type="date" value={dateRange.from} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))} className="w-[140px]" />
            <Input type="date" value={dateRange.to} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))} className="w-[140px]" />
            <ExportButton
              data={entries}
              filename="cash-flow"
              title="Cash Flow Entries"
              columns={[
                { key: 'entry_date', header: 'Date', formatter: v => new Date(v).toLocaleDateString() },
                { key: 'type', header: 'Type' },
                { key: 'category', header: 'Category' },
                { key: 'description', header: 'Description', formatter: v => v || '—' },
                { key: 'amount', header: 'Amount', formatter: (v, row) => `${row.type === 'inflow' ? '+' : '-'}₱${v.toFixed(2)}` },
              ]}
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Entry</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Cash Flow Entry</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as 'inflow' | 'outflow' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inflow">Inflow</SelectItem>
                          <SelectItem value="outflow">Outflow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount (₱) *</Label>
                      <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={form.entry_date} onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave}>Save Entry</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No entries recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={entry.type === 'inflow' ? 'default' : 'secondary'} className="capitalize gap-1">
                          {entry.type === 'inflow' ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.description || '—'}</TableCell>
                      <TableCell className={`text-right font-medium ${entry.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.type === 'inflow' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </BusinessLayout>
  );
}
