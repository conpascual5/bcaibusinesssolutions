import { useState, useEffect, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { Plus, FileText, Search, Eye, Printer, PenLine, Upload, Trash2 } from 'lucide-react';
import { KPISkeleton, TableSkeleton } from '@/components/BusinessSkeleton';
import ExportButton from '@/components/ExportButton';

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
  customer_tin: string | null;
  items: any[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  due_date: string | null;
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
  signature_data: string | null;
  signature_name: string | null;
  business_name: string | null;
  business_address: string | null;
  business_logo_url: string | null;
}

export default function BusinessInvoices() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [form, setForm] = useState({
    customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_address: '', customer_tin: '',
    items: [] as { description: string; quantity: number; unit_price: number }[],
    tax: '12', discount: '0', due_date: '', payment_terms: 'Due upon receipt', notes: '',
    business_name: '', business_address: '', business_logo_url: '',
    signature_data: '', signature_name: '',
  });

  useEffect(() => {
    if (user) { fetchCustomers(); fetchInvoices(); loadBusinessProfile(); }
  }, [user]);

  async function loadBusinessProfile() {
    const { data } = await supabase
      .from('invoices')
      .select('business_name, business_address, business_logo_url')
      .eq('user_id', user!.id)
      .not('business_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setForm(f => ({
        ...f,
        business_name: data.business_name || '',
        business_address: data.business_address || '',
        business_logo_url: data.business_logo_url || '',
      }));
    }
  }

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

  // Signature pad handlers
  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setForm(f => ({ ...f, signature_data: canvas.toDataURL() }));
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setForm(f => ({ ...f, signature_data: '' }));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, business_logo_url: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
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
      customer_address: form.customer_address || null, customer_tin: form.customer_tin || null,
      items: form.items,
      subtotal, tax: taxAmount, discount: discountAmount, total,
      status: 'sent', due_date: form.due_date || null, payment_terms: form.payment_terms || null,
      notes: form.notes || null,
      signature_data: form.signature_data || null,
      signature_name: form.signature_name || null,
      business_name: form.business_name || null,
      business_address: form.business_address || null,
      business_logo_url: form.business_logo_url || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Invoice created!');
    setDialogOpen(false);
    setForm({
      customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_address: '', customer_tin: '',
      items: [], tax: '12', discount: '0', due_date: '', payment_terms: 'Due upon receipt', notes: '',
      business_name: form.business_name, business_address: form.business_address, business_logo_url: form.business_logo_url,
      signature_data: '', signature_name: '',
    });
    clearSignature();
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
    <BusinessLayout title="Invoice Generation" description="Create customizable invoices with e-signature and business branding">
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
            <ExportButton
              data={filtered}
              filename="invoices"
              title="Invoice List"
              columns={[
                { key: 'invoice_number', header: 'Invoice #' },
                { key: 'customer_name', header: 'Customer', formatter: v => v || '—' },
                { key: 'created_at', header: 'Date', formatter: v => new Date(v).toLocaleDateString() },
                { key: 'due_date', header: 'Due Date', formatter: v => v ? new Date(v).toLocaleDateString() : '—' },
                { key: 'total', header: 'Total', formatter: v => `₱${v.toFixed(2)}` },
                { key: 'status', header: 'Status' },
              ]}
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> New Invoice</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="create">Invoice Details</TabsTrigger>
                    <TabsTrigger value="branding">Business Branding</TabsTrigger>
                    <TabsTrigger value="signature">E-Signature</TabsTrigger>
                  </TabsList>

                  <TabsContent value="create" className="space-y-4">
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
                      <Input placeholder="Phone (+63...)" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
                      <Input placeholder="TIN (Tax ID)" value={form.customer_tin} onChange={e => setForm(f => ({ ...f, customer_tin: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Due date" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                      <Select value={form.payment_terms} onValueChange={v => setForm(f => ({ ...f, payment_terms: v }))}>
                        <SelectTrigger><SelectValue placeholder="Payment terms" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Due upon receipt">Due upon receipt</SelectItem>
                          <SelectItem value="Net 7">Net 7</SelectItem>
                          <SelectItem value="Net 15">Net 15</SelectItem>
                          <SelectItem value="Net 30">Net 30</SelectItem>
                          <SelectItem value="Net 60">Net 60</SelectItem>
                          <SelectItem value="COD">COD</SelectItem>
                        </SelectContent>
                      </Select>
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
                  </TabsContent>

                  <TabsContent value="branding" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input placeholder="Your business name" value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Address</Label>
                      <Textarea placeholder="Your business address" value={form.business_address} onChange={e => setForm(f => ({ ...f, business_address: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Logo</Label>
                      <div className="flex items-center gap-4">
                        <Button variant="outline" className="gap-2" onClick={() => document.getElementById('logo-upload')?.click()}>
                          <Upload className="w-4 h-4" /> Upload Logo
                        </Button>
                        <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        {form.business_logo_url && (
                          <div className="relative">
                            <img src={form.business_logo_url} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg border" />
                            <button
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                              onClick={() => setForm(f => ({ ...f, business_logo_url: '' }))}
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {form.business_logo_url && (
                      <div className="rounded-lg bg-muted/30 p-4 flex items-center gap-4">
                        <img src={form.business_logo_url} alt="Logo" className="w-12 h-12 object-contain rounded" />
                        <div>
                          <p className="font-semibold text-sm">{form.business_name || 'Your Business Name'}</p>
                          <p className="text-xs text-muted-foreground">{form.business_address || 'Your Address'}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="signature" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Signatory Name</Label>
                      <Input
                        placeholder="Name of person signing"
                        value={form.signature_name}
                        onChange={e => setForm(f => ({ ...f, signature_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Draw Your Signature</Label>
                        <Button variant="ghost" size="sm" onClick={clearSignature} className="text-red-500 gap-1">
                          <Trash2 className="w-3 h-3" /> Clear
                        </Button>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
                        <canvas
                          ref={canvasRef}
                          width={500}
                          height={150}
                          className="w-full touch-none cursor-crosshair"
                          style={{ height: '150px' }}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <PenLine className="w-3 h-3" /> Draw your signature above using mouse or touch
                      </p>
                    </div>
                    {form.signature_data && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-green-800">Signature captured successfully</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-2 border-t">
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {previewInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>Invoice {previewInvoice.invoice_number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Business Header */}
                <div className="flex items-start justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    {previewInvoice.business_logo_url && (
                      <img src={previewInvoice.business_logo_url} alt="Logo" className="w-14 h-14 object-contain rounded-lg border" />
                    )}
                    <div>
                      <p className="font-bold text-lg">{previewInvoice.business_name || 'Business Name'}</p>
                      {previewInvoice.business_address && (
                        <p className="text-sm text-muted-foreground">{previewInvoice.business_address}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">{previewInvoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(previewInvoice.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-b pb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bill To</p>
                  <p className="font-semibold">{previewInvoice.customer_name || 'Customer'}</p>
                  {previewInvoice.customer_email && <p className="text-sm text-muted-foreground">{previewInvoice.customer_email}</p>}
                  {previewInvoice.customer_phone && <p className="text-sm text-muted-foreground">{previewInvoice.customer_phone}</p>}
                  {previewInvoice.customer_tin && <p className="text-sm text-muted-foreground">TIN: {previewInvoice.customer_tin}</p>}
                  {previewInvoice.payment_terms && <p className="text-sm text-muted-foreground">Terms: {previewInvoice.payment_terms}</p>}
                </div>

                {/* Items Table */}
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

                {/* Totals */}
                <div className="space-y-1 text-sm border-t pt-3">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(previewInvoice.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(previewInvoice.tax)}</span></div>
                  <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(previewInvoice.discount)}</span></div>
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(previewInvoice.total)}</span></div>
                </div>

                {/* Notes */}
                {previewInvoice.notes && (
                  <div className="text-sm text-muted-foreground border-t pt-2">
                    <p className="font-semibold text-xs text-gray-700 mb-1">Notes:</p>
                    <p>{previewInvoice.notes}</p>
                  </div>
                )}

                {/* Signature */}
                {previewInvoice.signature_data && (
                  <div className="border-t pt-3 flex items-center gap-3">
                    <div>
                      <img
                        src={previewInvoice.signature_data}
                        alt="Signature"
                        className="h-12 object-contain"
                      />
                      {previewInvoice.signature_name && (
                        <p className="text-xs text-muted-foreground mt-1">{previewInvoice.signature_name}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p className="font-semibold text-gray-700">Authorized Signature</p>
                    </div>
                  </div>
                )}

                {/* Payment Options */}
                <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
                  <p className="font-semibold text-xs">Payment Options:</p>
                  <p>GCash | Maya | BDO | BPI | Metrobank | Bank Transfer | Cheque</p>
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
