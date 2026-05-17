import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Database, Search, Calendar, Download } from 'lucide-react';

interface RecordEntry {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  record_type: string;
  record_date: string;
  notes: string | null;
  created_at: string;
}

const RECORD_CATEGORIES = ['Sales', 'Expense', 'Payroll', 'Invoice', 'Inventory', 'Customer', 'Other'];

export default function BusinessRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [form, setForm] = useState({
    category: 'Sales', description: '', amount: '',
    record_type: 'income', record_date: new Date().toISOString().split('T')[0], notes: ''
  });

  useEffect(() => {
    if (user) fetchRecords();
  }, [user, yearFilter]);

  async function fetchRecords() {
    const startDate = `${yearFilter}-01-01`;
    const endDate = `${yearFilter}-12-31`;
    const { data } = await supabase
      .from('cash_flow')
      .select('*')
      .eq('user_id', user!.id)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: false });
    if (data) setRecords(data.map(d => ({
      id: d.id, category: d.category, description: d.description,
      amount: d.amount, record_type: d.type === 'inflow' ? 'income' : 'expense',
      record_date: d.entry_date, notes: d.notes, created_at: d.created_at
    })));
    setLoading(false);
  }

  async function handleSave() {
    if (!form.amount) {
      toast.error('Amount is required');
      return;
    }
    const { error } = await supabase.from('cash_flow').insert({
      user_id: user!.id, type: form.record_type === 'income' ? 'inflow' : 'outflow',
      category: form.category, description: form.description || null,
      amount: parseFloat(form.amount), entry_date: form.record_date, notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Record saved');
    setDialogOpen(false);
    setForm({ category: 'Sales', description: '', amount: '', record_type: 'income', record_date: new Date().toISOString().split('T')[0], notes: '' });
    fetchRecords();
  }

  const filtered = records.filter(r =>
    r.category.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalIncome = filtered.filter(r => r.record_type === 'income').reduce((s, r) => s + r.amount, 0);
  const totalExpense = filtered.filter(r => r.record_type === 'expense').reduce((s, r) => s + r.amount, 0);

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <BusinessLayout title="Record Keeping" description="Multi-year data storage and archival">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Year</CardTitle></CardHeader>
          <CardContent>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Income</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">${totalIncome.toFixed(2)}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Total Expenses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-rose-800 dark:text-rose-300">${totalExpense.toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              ${(totalIncome - totalExpense).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>Yearly Records ({yearFilter})</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-[180px]" />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Record</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Record</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={form.record_type} onValueChange={v => setForm(f => ({ ...f, record_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {RECORD_CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
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
                      <Label>Amount ($) *</Label>
                      <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={form.record_date} onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave}>Save Record</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No records for {yearFilter}</p>
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
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.record_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={r.record_type === 'income' ? 'default' : 'destructive'} className="capitalize text-xs">
                          {r.record_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.description || '—'}</TableCell>
                      <TableCell className={`text-right font-medium ${r.record_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {r.record_type === 'income' ? '+' : '-'}${r.amount.toFixed(2)}
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
