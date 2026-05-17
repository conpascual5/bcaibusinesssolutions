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
import { Plus, Receipt, Users, TrendingDown, Calendar } from 'lucide-react';
import { KPISkeleton, TableSkeleton } from '@/components/BusinessSkeleton';
import ExportButton from '@/components/ExportButton';

interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_type: string;
  expense_date: string;
  created_at: string;
}

const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Transportation', 'Food', 'Maintenance', 'Insurance', 'SSS', 'PhilHealth', 'Pag-IBIG', 'BIR', "Mayor's Permit", 'Taxes', 'Other'];
const EXPENSE_TYPES = ['operational', 'payroll', 'miscellaneous'];

export default function BusinessExpenses() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] });
  const [form, setForm] = useState({ category: 'Supplies', description: '', amount: '', expense_type: 'operational', expense_date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (businessOwnerId) fetchExpenses();
  }, [businessOwnerId, dateRange]);

  async function fetchExpenses() {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', businessOwnerId!)
      .gte('expense_date', dateRange.from)
      .lte('expense_date', dateRange.to)
      .order('expense_date', { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.amount) { toast.error('Amount is required'); return; }
    const { error } = await supabase.from('expenses').insert({
      user_id: businessOwnerId!, category: form.category, description: form.description || null,
      amount: parseFloat(form.amount), expense_type: form.expense_type, expense_date: form.expense_date,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Expense recorded!');
    setDialogOpen(false);
    setForm({ category: 'Supplies', description: '', amount: '', expense_type: 'operational', expense_date: new Date().toISOString().split('T')[0] });
    fetchExpenses();
  }

  const totalExpenses = expenses.filter(e => e.expense_type !== 'payroll').reduce((s, e) => s + e.amount, 0);
  const totalPayroll = expenses.filter(e => e.expense_type === 'payroll').reduce((s, e) => s + e.amount, 0);
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <BusinessLayout title="Expenses & Payroll" description="Track daily expenses and payroll">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{expenses.length}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Total Expenses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-rose-800 dark:text-rose-300">{formatCurrency(totalExpenses)}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">Payroll</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{formatCurrency(totalPayroll)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Grand Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>Expense Entries</CardTitle>
          <div className="flex items-center gap-3">
            <Input type="date" value={dateRange.from} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))} className="w-[140px]" />
            <Input type="date" value={dateRange.to} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))} className="w-[140px]" />
            <ExportButton
              data={expenses}
              filename="expenses"
              title="Expense Entries"
              columns={[
                { key: 'expense_date', header: 'Date', formatter: v => new Date(v).toLocaleDateString() },
                { key: 'expense_type', header: 'Type' },
                { key: 'category', header: 'Category' },
                { key: 'description', header: 'Description', formatter: v => v || '—' },
                { key: 'amount', header: 'Amount', formatter: v => `₱${v.toFixed(2)}` },
              ]}
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Expense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={form.expense_type} onValueChange={v => setForm(f => ({ ...f, expense_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EXPENSE_TYPES.map(t => (<SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
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
                      <Input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave}>Save Expense</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No expenses recorded</p>
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
                  {expenses.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell>{new Date(exp.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={exp.expense_type === 'payroll' ? 'default' : 'secondary'} className="capitalize text-xs">
                          {exp.expense_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{exp.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{exp.description || '—'}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">{formatCurrency(exp.amount)}</TableCell>
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
