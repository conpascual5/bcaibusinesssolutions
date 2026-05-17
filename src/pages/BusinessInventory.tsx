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
import { Plus, Package, ArrowDownUp, TrendingDown, TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
}

interface InventoryItem {
  id: string;
  product_id: string;
  quantity: number;
  type: 'in' | 'out';
  reference: string | null;
  notes: string | null;
  created_at: string;
  products: Product | null;
}

export default function BusinessInventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: '', quantity: '', type: 'in' as 'in' | 'out', reference: '', notes: '' });

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
      .select('*, products:product_id(name, sku, unit)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setMovements(data as any);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.product_id || !form.quantity) {
      toast.error('Product and quantity are required');
      return;
    }

    const { error } = await supabase.from('inventory').insert({
      user_id: user!.id,
      product_id: form.product_id,
      quantity: parseInt(form.quantity),
      type: form.type,
      reference: form.reference || null,
      notes: form.notes || null,
    });

    if (error) { toast.error(error.message); return; }
    toast.success(`Stock ${form.type === 'in' ? 'added' : 'removed'} successfully`);
    setDialogOpen(false);
    setForm({ product_id: '', quantity: '', type: 'in', reference: '', notes: '' });
    fetchMovements();
  }

  // Calculate stock levels per product
  const stockLevels = movements.reduce((acc, m) => {
    const pid = m.product_id;
    if (!acc[pid]) acc[pid] = { product: m.products, quantity: 0 };
    acc[pid].quantity += m.type === 'in' ? m.quantity : -m.quantity;
    return acc;
  }, {} as Record<string, { product: Product | null; quantity: number }>);

  const totalIn = movements.filter(m => m.type === 'in').reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter(m => m.type === 'out').reduce((s, m) => s + m.quantity, 0);

  return (
    <BusinessLayout title="Inventory System" description="Track stock-in and stock-out movements">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Object.keys(stockLevels).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock In</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <p className="text-2xl font-bold">{totalIn}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Out</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <p className="text-2xl font-bold">{totalOut}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{movements.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Stock Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Current Stock Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stockLevels).length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No stock data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stockLevels).map(([pid, sl]) => (
                  <div key={pid} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{sl.product?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{sl.product?.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${sl.quantity <= 0 ? 'text-red-500' : sl.quantity < 10 ? 'text-amber-500' : 'text-green-500'}`}>
                        {sl.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">{sl.product?.unit || 'pcs'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowDownUp className="w-5 h-5" />
              Recent Movements
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Movement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Stock Movement</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as 'in' | 'out' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">
                            <span className="flex items-center gap-2"><TrendingUp className="w-3 h-3 text-green-500" /> Stock In</span>
                          </SelectItem>
                          <SelectItem value="out">
                            <span className="flex items-center gap-2"><TrendingDown className="w-3 h-3 text-red-500" /> Stock Out</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference (optional)</Label>
                    <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="PO-001, invoice #, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
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
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : movements.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No movements recorded yet</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {movements.slice(0, 20).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={m.type === 'in' ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                        {m.type === 'in' ? 'IN' : 'OUT'}
                      </Badge>
                      <div>
                        <p className="font-medium">{m.products?.name || 'Unknown'}</p>
                        {m.reference && <p className="text-xs text-muted-foreground">{m.reference}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${m.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                        {m.type === 'in' ? '+' : '-'}{m.quantity}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  );
}
