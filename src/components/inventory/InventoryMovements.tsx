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
import { toast } from 'sonner';
import { Plus, Filter, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import ExportButton from '@/components/ExportButton';

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
  products: { name: string; sku: string | null; unit: string } | null;
}

interface Props {
  movements: StockMovement[];
  products: Product[];
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 15;

export default function InventoryMovements({ movements, products, onRefresh }: Props) {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'in' | 'out'>('in');
  const [form, setForm] = useState({ product_id: '', quantity: '1', reference: '', notes: '' });

  const filtered = movements.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (filterProduct !== 'all' && m.product_id !== filterProduct) return false;
    if (filterDateFrom && m.created_at < filterDateFrom) return false;
    if (filterDateTo && m.created_at > filterDateTo + 'T23:59:59') return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  async function handleSave() {
    if (!form.product_id) { toast.error('Select a product'); return; }
    const qty = parseInt(form.quantity) || 1;
    const { error } = await supabase.from('inventory').insert({
      product_id: form.product_id,
      quantity: qty,
      type: dialogMode,
      reference: form.reference || null,
      notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Stock ${dialogMode === 'in' ? 'added' : 'removed'} successfully`);
    setDialogOpen(false);
    setForm({ product_id: '', quantity: '1', reference: '', notes: '' });
    onRefresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">Stock In & Out Log</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={v => { setFilterType(v as any); setPage(1); }}>
              <SelectTrigger className="h-9 w-28 text-xs"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProduct} onValueChange={v => { setFilterProduct(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-36 text-xs"><SelectValue placeholder="All Products" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }} className="h-9 w-32 text-xs" />
            <Input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }} className="h-9 w-32 text-xs" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={filtered}
            filename="inventory-movements"
            title="Inventory Movement History"
            columns={[
              { key: 'created_at', header: 'Date', formatter: v => new Date(v).toLocaleDateString() },
              { key: 'products', header: 'Product', formatter: (_, row) => row.products?.name || '—' },
              { key: 'type', header: 'Type', formatter: v => v === 'in' ? 'Stock In' : 'Stock Out' },
              { key: 'quantity', header: 'Quantity', formatter: (v, row) => `${row.type === 'in' ? '+' : '-'}${v}` },
              { key: 'reference', header: 'Reference', formatter: v => v || '—' },
              { key: 'notes', header: 'Notes', formatter: v => v || '—' },
            ]}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Record Movement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Stock Movement</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={dialogMode === 'in' ? 'default' : 'outline'} size="sm"
                        className={`flex-1 gap-1.5 ${dialogMode === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => setDialogMode('in')}>
                        <TrendingUp className="w-3.5 h-3.5" /> Stock In
                      </Button>
                      <Button type="button" variant={dialogMode === 'out' ? 'default' : 'outline'} size="sm"
                        className={`flex-1 gap-1.5 ${dialogMode === 'out' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
                        onClick={() => setDialogMode('out')}>
                        <TrendingDown className="w-3.5 h-3.5" /> Stock Out
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</SelectItem>))}
                    </SelectContent>
                  </Select>
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
        </div>
      </CardHeader>
      <CardContent>
        {paginated.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No movements recorded</p>
        ) : (
          <>
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
                  {paginated.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(m.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell className="font-medium">{m.products?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge className={m.type === 'in' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}>
                          {m.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${m.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {m.type === 'in' ? '+' : '-'}{m.quantity} {m.products?.unit || ''}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.reference || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{m.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} ({filtered.length} entries)
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
