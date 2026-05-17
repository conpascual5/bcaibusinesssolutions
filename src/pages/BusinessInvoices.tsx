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
import { Plus, FileText, Search, Eye, Printer } from 'lucide-react';
import { KPISkeleton, TableSkeleton } from '@/components/BusinessSkeleton';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  items: any[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

export default function BusinessInvoices() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_address: '',
    items: [] as { description: string; quantity: number; unit_price: number }[],
    tax: '0', discount: '0', due_date: '', notes: '',
  });

  useEffect(() => {
    if (user) { fetchCustomers(); fetchInvoices(); }
  }, [user]);

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('id, name, email, phone, address').eq('user_id', user!.id);
    if (data) setCustomers(data);
  }

  async function fetchInvoices() {
    const { data } = await supabase.from('invoices').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setInvoices(data);
    setLoading(false);
  }

  function generateInvoiceNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `INV-${date}-${rand}`;
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unit_price: 0 }] }));
  }

  function updateItem(index: number, field: string, value: any) {
    setForm(f => {
      const items = [...f.items];
      (items[index] as any)[field] = value;
      return { ...f, items };
    });
  }

  function removeItem(index: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  function selectCustomer(id: string) {
    const c = customers.find(c => c.id === id);
    if (c) {
      setForm(f => ({
        ...f, customer_id: id, customer_name: c.name,
        customer_email: c.email || '', customer_phone: c.phone || '', customer_address: c.address || '',
      }));
    }
  }

  const subtotal = form.items.reduce((s, item) => s + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * (parseFloat(form.tax) || 0) / 100;
  const discountAmount = parseFloat(form.discount) || 0;
  const total = subtotal + taxAmount - discountAmount;

  async function handleSave() {
    if (form.items.length === 0 || !form.items[0].description) {
      toast.error('Add at least one item');
      return;
    }
    const { error } = await supabase.from('invoices').insert({
      user_id: user!.id, invoice_number: generateInvoiceNumber(),
      customer_id: form.customer_id || null, customer_name: form.customer_name || null,
      customer_email: form.customer_email || null, customer_phone: form.customer_phone || null,
      customer_address: form.customer_address || null, items: form.items,
      subtotal, tax: taxAmount, discount: discountAmount, total,
      status: 'sent', due_date: form.due_date || null, notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Invoice created!');
    setDialogOpen(false);
    setForm({ customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_address: '', items: [], tax: '0', discount: '0', due_date: '', notes: '' });
    fetchInvoices();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Invoice marked as ${status}`);
    fetchInvoices();
  }

  const filtered = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <BusinessLayout title="Invoice Generation" description="Create and manage invoices with one click">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{invoices.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{invoices.filter(i => i.status === 'sent').length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{invoices.filter(i => i.status === 'paid').length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(invoices.reduce((s, i) => s + i.total, 0))}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>All Invoices</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-[180px]" />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> New Invoice</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select value={form.customer_id} onValueChange={selectCustomer}>
                      <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Customer name" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
                    <Input placeholder="Email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Phone" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
                    <Input placeholder="Due date" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Items</Label>
                      <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add Item</Button>
                    </div>
                    {form.items.map((item, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <Input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="flex-1" />
                        <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="w-20" />
                        <Input type="number" step="0.01" placeholder="Price" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} className="w-24" />
                        <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="text-red-500 shrink-0">×</Button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tax (%)</Label>
                      <Input type="number" step="0.1" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount (₱)</Label>
                      <Input type="number" step="0.01" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(taxAmount)}</span></div>
                    <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>
                    <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>{formatCurrency(total)}</span></div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave}>Create Invoice</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{search ? 'No invoices match' : 'No invoices yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.customer_name || '—'}</TableCell>
                      <TableCell className="text-sm">{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(inv.total)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'sent' ? 'secondary' : 'outline'} className="capitalize">
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setPreviewInvoice(inv)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {inv.status === 'sent' && (
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(inv.id, 'paid')}>
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <Dialog open={!!previewInvoice} onOpenChange={(open) => { if (!open) setPreviewInvoice(null); }}>
        <DialogContent className="sm:max-w-lg">
          {previewInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>Invoice {previewInvoice.invoice_number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="font-semibold">{previewInvoice.customer_name || 'Customer'}</p>
                  {previewInvoice.customer_email && <p className="text-sm text-muted-foreground">{previewInvoice.customer_email}</p>}
                  {previewInvoice.customer_phone && <p className="text-sm text-muted-foreground">{previewInvoice.customer_phone}</p>}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(previewInvoice.items || []).map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.quantity * item.unit_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="space-y-1 text-sm border-t pt-3">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(previewInvoice.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(previewInvoice.tax)}</span></div>
                  <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(previewInvoice.discount)}</span></div>
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(previewInvoice.total)}</span></div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                    <Printer className="w-4 h-4" /> Print
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
}
