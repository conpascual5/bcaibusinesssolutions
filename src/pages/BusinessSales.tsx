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
import { Plus, DollarSign, TrendingUp, BarChart3, Calendar } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  unit_price: number;
  cost_price: number | null;
}

interface Sale {
  id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  profit: number;
  payment_method: string;
  status: string;
  sale_date: string;
  notes: string | null;
  created_at: string;
  products: Product | null;
}

export default function BusinessSales() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState('7');
  const [form, setForm] = useState({
    product_id: '', quantity: '1', unit_price: '',
    payment_method: 'cash',
    sale_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (user) { fetchProducts(); fetchSales(); }
  }, [user, dateRange]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name, unit_price, cost_price').eq('user_id', user!.id);
    if (data) setProducts(data);
  }

  async function fetchSales() {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
    const { data } = await supabase
      .from('sales')
      .select('*, products:product_id(name, unit_price, cost_price)')
      .eq('user_id', user!.id)
      .gte('sale_date', daysAgo.toISOString().split('T')[0])
      .order('sale_date', { ascending: false });
    if (data) setSales(data as any);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.unit_price) {
      toast.error('Unit price is required');
      return;
    }
    const qty = parseInt(form.quantity) || 1;
    const unitPrice = parseFloat(form.unit_price);
    const total = qty * unitPrice;
    const product = products.find(p => p.id === form.product_id);
    const costPrice = product?.cost_price || 0;
    const profit = (unitPrice - costPrice) * qty;

    const { error } = await supabase.from('sales').insert({
      user_id: user!.id,
      product_id: form.product_id || null,
      quantity: qty,
      unit_price: unitPrice,
      total_amount: total,
      profit,
      payment_method: form.payment_method,
      sale_date: form.sale_date,
      notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Sale recorded!');
    setDialogOpen(false);
    setForm({ product_id: '', quantity: '1', unit_price: '', payment_method: 'cash', sale_date: new Date().toISOString().split('T')[0], notes: '' });
    fetchSales();
  }

  const totalRevenue = sales.reduce((s, r) => s + r.total_amount, 0);
  const totalProfit = sales.reduce((s, r) => s + r.profit, 0);
  const totalTransactions = sales.length;

  return (
    <BusinessLayout title="Profit & Sales Tracker" description="Monitor daily revenue and profit">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">${totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">${totalProfit.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTransactions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg per Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalTransactions ? (totalRevenue / totalTransactions).toFixed(2) : '0.00'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>Sales Records</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Today</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">This year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Record Sale</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record New Sale</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Product (optional)</Label>
                    <Select value={form.product_id} onValueChange={v => {
                      const p = products.find(pr => pr.id === v);
                      setForm(f => ({ ...f, product_id: v, unit_price: p ? String(p.unit_price) : f.unit_price }));
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} - ${p.unit_price}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price ($) *</Label>
                      <Input type="number" step="0.01" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mobile">Mobile Money</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={form.sale_date} onChange={e => setForm(f => ({ ...f, sale_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave}>Record Sale</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No sales recorded in this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{sale.products?.name || '—'}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell className="text-right">${sale.unit_price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">${sale.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={sale.profit >= 0 ? 'text-green-600' : 'text-red-500'}>
                          ${sale.profit.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">{sale.payment_method}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                          {sale.status}
                        </Badge>
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
