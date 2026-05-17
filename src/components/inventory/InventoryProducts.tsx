import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import ExportButton from '@/components/ExportButton';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  unit_price: number;
  cost_price: number | null;
  category: string;
}

interface StockLevel {
  product: Product;
  quantity: number;
}

interface Props {
  products: Product[];
  stockLevels: Record<string, StockLevel>;
  onRefresh: () => void;
}

export default function InventoryProducts({ products, stockLevels, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', unit: 'pcs', unit_price: '', cost_price: '', category: 'product' });

  function resetForm() {
    setForm({ name: '', sku: '', unit: 'pcs', unit_price: '', cost_price: '', category: 'product' });
    setEditingProduct(null);
  }

  async function handleSave() {
    if (!form.name || !form.unit_price) {
      toast.error('Name and unit price are required');
      return;
    }
    const payload = {
      name: form.name,
      sku: form.sku || null,
      unit: form.unit,
      unit_price: parseFloat(form.unit_price),
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      category: form.category,
    };
    if (editingProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Product added');
    }
    setDialogOpen(false);
    resetForm();
    onRefresh();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Product deleted');
    onRefresh();
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku || '',
      unit: product.unit,
      unit_price: String(product.unit_price),
      cost_price: product.cost_price ? String(product.cost_price) : '',
      category: product.category,
    });
    setDialogOpen(true);
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">Product List</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 w-48 text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={filtered}
            filename="inventory-products"
            title="Inventory Products List"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'sku', header: 'SKU', formatter: v => v || '—' },
              { key: 'category', header: 'Category' },
              { key: 'unit', header: 'Unit' },
              { key: 'unit_price', header: 'Unit Price', formatter: v => formatCurrency(v) },
              { key: 'cost_price', header: 'Cost Price', formatter: v => v ? formatCurrency(v) : '—' },
              { key: 'id', header: 'Stock Level', formatter: (_, row) => String(stockLevels[row.id]?.quantity ?? 0) },
            ]}
          />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="raw">Raw Material</SelectItem>
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
                        <SelectItem value="g">Grams</SelectItem>
                        <SelectItem value="L">Liters</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
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
                <Button onClick={handleSave}>{editingProduct ? 'Update' : 'Save Product'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{search ? 'No products match your search' : 'No products yet. Add your first product!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => {
                  const stock = stockLevels[p.id]?.quantity ?? 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.sku || '—'}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize text-[10px]">{p.category}</Badge></TableCell>
                      <TableCell className="text-sm">{p.unit}</TableCell>
                      <TableCell className="text-right text-sm">{p.cost_price ? formatCurrency(p.cost_price) : '—'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.unit_price)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold text-sm ${stock <= 0 ? 'text-red-500' : stock <= 5 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{stock}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(stock * p.unit_price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
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
  );
}
