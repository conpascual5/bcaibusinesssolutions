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
import { Plus, DollarSign, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { KPISkeleton, TableSkeleton } from '@/components/BusinessSkeleton';
import ExportButton from '@/components/ExportButton';

interface Product {
  id: string;
  name: string;
  unit_price: number;
  cost_price: number | null;
}

interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  profit: number;
  payment_method: string;
  status: string;
  sale_date: string;
  products: { name: string } | null;
}

export default function BusinessSales() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] });
  const [form, setForm] = useState({ product_id: '', quantity: '1', unit_price: '', payment_method: 'cash', sale_date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (businessOwnerId) { fetchProducts(); fetchSales(); }
  }, [businessOwnerId, dateRange]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name, unit_price, cost_price').eq('user_id', businessOwnerId!);
    if (data) setProducts(data);
  }

  async function fetchSales() {
    const { data } = await supabase
      .from('sales')
      .select('*, products:product_id(name)')
      .eq('user_id', businessOwnerId!)
      .gte('sale_date', dateRange.from)
      .lte('sale_date', dateRange.to)
      .order('sale_date', { ascending: false });
    if (data) setSales(data);
    setLoading(false);
  }

  function selectProduct(id: string) {
    const p = products.find(p => p.id === id);
    if (p) setForm(f => ({ ...f, product_id: id, unit_price: p.unit_price.toString() }));
  }

  const totalRevenue = sales.reduce((s, r) => s + r.total_amount, 0);
  const totalProfit = sales.reduce((s, r) => s + r.profit, 0);
  const totalTransactions = sales.length;

  async function handleSave() {
    if (!form.product_id) { toast.error('Select a product'); return; }
    const qty = parseInt(form.quantity) || 1;
    const price = parseFloat(form.unit_price) || 0;
    const total = qty * price;
    const product = products.find(p => p.id === form.product_id);
    const cost = (product?.cost_price || 0) * qty;
    const profit = total - cost;

    const { error } = await supabase.from('sales').insert({
      user_id: businessOwnerId!, product_id: form.product_id, quantity: qty,
      unit_price: price, total_amount: total, profit,
      payment_method: form.payment_method, sale_date: form.sale_date,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Sale recorded!');
    setDialogOpen(false);
    setForm({ product_id: '', quantity: '1', unit_price: '', payment_method: 'cash', sale_date: new Date().toISOString().split('T')[0] });
    fetchSales();
  }

  return (
    <BusinessLayout title="Profit & Sales Tracker" description="Monitor daily revenue and profit">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalTransactions}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{formatCurrency(totalRevenue)}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Profit</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{formatCurrency(totalProfit)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg per Sale</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalTransactions ? formatCurrency(totalRevenue / totalTransactions) : formatCurrency(0)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>Sales Transactions</CardTitle>
          <div className="flex items-center gap-3">
            <Input type="date" value={dateRange.from} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))} className="w-[140px]" />
            <Input type="date" value={dateRange.to} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))} className="w-[140px]" />
            <ExportButton
              data={sales}
              filename="sales"
              title="Sales Transactions"
              columns={[
                { key: 'sale_date', header: 'Date', formatter: v => new Date(v).toLocaleDateString() },
                { key: 'products', header: 'Product', formatter: (_, row) => row.products?.name || '—' },
                { key: 'quantity', header: 'Qty' },
                { key: 'unit_price', header: 'Unit Price', formatter: v => `₱${v.toFixed(2)}` },
                { key: 'total_amount', header: 'Total', formatter: v => `₱${v.toFixed(2)}` },
                { key: 'profit', header: 'Profit', formatter: v => `₱${v.toFixed(2)}` },
                { key: 'payment_method', header: 'Payment' },
                { key: 'status', header: 'Status' },
              ]}
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Record Sale</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Sale</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={form.product_id} onValueChange={selectProduct}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name} - {formatCurrency(p.unit_price)}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price (₱) *</Label>
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
                          <SelectItem value="gcash">GCash</SelectItem>
                          <SelectItem value="maya">Maya</SelectItem>
                          <SelectItem value="bdo">BDO</SelectItem>
                          <SelectItem value="bpi">BPI</SelectItem>
                          <SelectItem value="metrobank">Metrobank</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={form.sale_date} onChange={e => setForm(f => ({ ...f, sale_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <div className="flex justify-between"><span>Total Amount</span><span className="font-bold">{formatCurrency((parseInt(form.quantity) || 1) * (parseFloat(form.unit_price) || 0))}</span></div>
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
            <TableSkeleton rows={5} />
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
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
                      <TableCell className="text-right">{formatCurrency(sale.unit_price)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(sale.total_amount)}</TableCell>
                      <TableCell className="text-right">
                        <span className={sale.profit >= 0 ? 'text-green-600' : 'text-red-500'}>
                          {formatCurrency(sale.profit)}
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
