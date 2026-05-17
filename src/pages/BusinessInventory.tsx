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
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { Plus, Package, ArrowDownUp, TrendingDown, TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  type: 'in' | 'out';
  reference: string | null;
  notes: string | null;
  created_at: string;
  products: { name: string; sku: string | null } | null;
}

export default function BusinessInventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: '', quantity: '1', type: 'in' as 'in' | 'out', reference: '', notes: '' });

  useEffect(() => {
    if (user) { fetchProducts(); fetchMovements(); }
  }, [user]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name, sku, unit').eq('user_id', user!.id);
    if (data) setProducts(data);
  }

  async function fetchMovements() {
    const { data } = await supabase
      .from('inventory')
      .select('*, products:product_id(name, sku)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setMovements(data);
    setLoading(false);
  }

  const stockLevels: Record<string, { product: Product; quantity: number }> = {};
  products.forEach(p => { stockLevels[p.id] = { product: p, quantity: 0 }; });
  movements.forEach(m => {
    if (stockLevels[m.product_id]) {
      stockLevels[m.product_id].quantity += m.type === 'in' ? m.quantity : -m.quantity;
    }
  });

  async function handleSave() {
    if (!form.product_id) { toast.error('Select a product'); return; }
    const qty = parseInt(form.quantity) || 1;
    const { error } = await supabase.from('inventory').insert({
      user_id: user!.id, product_id: form.product_id, quantity: qty,
      type: form.type, reference: form.reference || null, notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Stock ${form.type === 'in' ? 'added' : 'removed'} successfully`);
    setDialogOpen(false);
    setForm({ product_id: '', quantity: '1', type: 'in', reference: '', notes: '' });
    fetchMovements();
  }

  return (
    <BusinessLayout title="Inventory System" description="Track stock-in and stock-out movements">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Products Tracked</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{products.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Movements</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{movements.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {Object.values(stockLevels).filter(sl => sl.quantity > 0 && sl.quantity <= 5).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-4 h-4" />
              Current Stock Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.values(stockLevels).length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">No products yet</p>
            ) : (
              <div className="space-y-2">
                {Object.values(stockLevels).map(sl => (
                  <div key={sl.product.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{sl.product.name}</p>
                      {sl.product.sku && <p className="text-[10px] text-muted-foreground">{sl.product.sku}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-lg font-bold ${sl.quantity <= 0 ? 'text-red-500' : sl.quantity < 10 ? 'text-amber-500' : 'text-green-500'}`}>
                        {sl.quantity}
                      </p>
                      <span className="text-xs text-muted-foreground">{sl.product.unit || 'pcs'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownUp className="w-4 h-4" />
              Recent Movements
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="w-3 h-3" /> New Movement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Stock Movement</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as 'in' | 'out' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">Stock In</SelectItem>
                          <SelectItem value="out">Stock Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference (optional)</Label>
                    <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="e.g. PO-001, Invoice #" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave}>Record Movement</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">No movements recorded</p>
            ) : (
              <div className="space-y-2">
                {movements.slice(0, 10).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 text-sm">
                    <div className="flex items-center gap-2">
                      {m.type === 'in' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-xs">{m.products?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${m.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                      {m.type === 'in' ? '+' : '-'}{m.quantity}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : movements.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No movements recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{m.products?.name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={m.type === 'in' ? 'default' : 'destructive'} className="text-xs">
                          {m.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">{m.type === 'in' ? '+' : '-'}{m.quantity}</TableCell>
                      <TableCell className="text-sm">{m.reference || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{m.notes || '—'}</TableCell>
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
