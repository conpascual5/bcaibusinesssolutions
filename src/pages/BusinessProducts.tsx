import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react';
import { KPISkeleton, TableSkeleton } from '@/components/BusinessSkeleton';
import ExportButton from '@/components/ExportButton';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  unit_price: number;
  cost_price: number | null;
  sku: string | null;
  unit: string;
}

export default function BusinessProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'product',
    unit_price: '',
    cost_price: '',
    sku: '',
    unit: 'pcs',
  });

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  }

  function resetForm() {
    setForm({ name: '', description: '', category: 'product', unit_price: '', cost_price: '', sku: '', unit: 'pcs' });
    setEditing(null);
  }

  async function handleSave() {
    if (!form.name || !form.unit_price) {
      toast.error('Name and unit price are required');
      return;
    }

    const payload = {
      user_id: user!.id,
      name: form.name,
      description: form.description || null,
      category: form.category,
      unit_price: parseFloat(form.unit_price),
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      sku: form.sku || null,
      unit: form.unit,
    };

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Product added');
    }

    setDialogOpen(false);
    resetForm();
    fetchProducts();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Product deleted');
    fetchProducts();
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category,
      unit_price: String(product.unit_price),
      cost_price: product.cost_price ? String(product.cost_price) : '',
      sku: product.sku || '',
      unit: product.unit,
    });
    setDialogOpen(true);
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = products.reduce((sum, p) => sum + p.unit_price, 0);

  return (
    <BusinessLayout title="Products & Services" description="Manage your products, services, and pricing">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Unit Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products.length ? formatCurrency(totalValue / products.length) : formatCurrency(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{new Set(products.map(p => p.category)).size}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Products</CardTitle>
          <div className="flex items-center gap-2">
          <ExportButton
            data={filtered}
            filename="products"
            title="Products List"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'sku', header: 'SKU', formatter: v => v || '—' },
              { key: 'category', header: 'Category' },
              { key: 'unit', header: 'Unit' },
              { key: 'cost_price', header: 'Cost Price', formatter: (v) => v ? `₱${v.toFixed(2)}` : '—' },
              { key: 'unit_price', header: 'Unit Price', formatter: (v) => `₱${v.toFixed(2)}` },
              { key: 'unit_price', header: 'Margin', formatter: (_, row) => row.cost_price ? `${(((row.unit_price - row.cost_price) / row.unit_price) * 100).toFixed(0)}%` : '—' },
            ]}
          />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="hr">Hour</SelectItem>
                        <SelectItem value="session">Session</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unit Price (₱) *</Label>
                    <Input type="number" step="0.01" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price (₱)</Label>
                    <Input type="number" step="0.01" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} placeholder="0.00" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSave}>{editing ? 'Update' : 'Save Product'}</Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <TableSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{search ? 'No products match your search' : 'No products yet. Add your first product!'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(product => {
                    const margin = product.cost_price ? ((product.unit_price - product.cost_price) / product.unit_price * 100) : null;
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{product.sku || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{product.category}</Badge>
                        </TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell className="text-right">{product.cost_price ? formatCurrency(product.cost_price) : '—'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(product.unit_price)}</TableCell>
                        <TableCell className="text-right">
                          {margin !== null ? (
                            <Badge variant={margin >= 30 ? 'default' : margin >= 10 ? 'secondary' : 'destructive'} className="text-xs">
                              {margin.toFixed(0)}%
                            </Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </BusinessLayout>
  );
}
