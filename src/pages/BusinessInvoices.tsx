import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import { useBusinessTeam } from '@/providers/business-team';
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
import {
  Plus, FileText, Trash2, Search,
  Receipt, Building2, User, Hash, DollarSign,
  CheckCircle2, XCircle, Clock, Send, Download,
  Loader2, AlertCircle, PenLine, Image,
} from 'lucide-react';
import { TableSkeleton } from '@/components/BusinessSkeleton';
import ExportButton from '@/components/ExportButton';

type InvoiceType = 'sales' | 'cash' | 'charge';
type VatType = 'vatable' | 'vat-exempt' | 'zero-rated';
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_type: VatType;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  is_vat: boolean;
  branch_code: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_tin: string | null;
  customer_address: string | null;
  items: LineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  vatable_amount: number;
  vat_exempt_amount: number;
  zero_rated_amount: number;
  vat_amount: number;
  status: InvoiceStatus;
  due_date: string | null;
  notes: string | null;
  payment_terms: string | null;
  business_name: string | null;
  business_address: string | null;
  business_logo_url: string | null;
  signature_data: string | null;
  signature_name: string | null;
  created_at: string;
}

interface InvoiceForm {
  business_name: string;
  tin: string;
  branch_code: string;
  business_address: string;
  business_logo_url: string;
  invoice_type: InvoiceType;
  invoice_number: string;
  date: string;
  payment_terms: string;
  buyer_name: string;
  buyer_tin: string;
  buyer_address: string;
  is_vat: boolean;
  items: LineItem[];
  notes: string;
  due_date: string;
  signature_data: string;
  signature_name: string;
  customer_id: string;
  payment_link: string;
}

const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  sales: 'Sales Invoice',
  cash: 'Cash Invoice',
  charge: 'Charge Invoice',
};

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof FileText }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: Clock },
  sent: { label: 'Sent', variant: 'default', icon: Send },
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function generateInvoiceNumber(type: InvoiceType): string {
  const prefix = type === 'sales' ? 'SI' : type === 'cash' ? 'CI' : 'CHI';
  return `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
}

export default function BusinessInvoices() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [downloading, setDownloading] = useState<string | null>(null);

  // Signature pad state
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [form, setForm] = useState<InvoiceForm>({
    business_name: user?.name || '',
    tin: '',
    branch_code: '001',
    business_address: '',
    business_logo_url: '',
    invoice_type: 'sales',
    invoice_number: generateInvoiceNumber('sales'),
    date: new Date().toISOString().split('T')[0],
    payment_terms: 'Due upon receipt',
    buyer_name: '',
    buyer_tin: '',
    buyer_address: '',
    is_vat: true,
    items: [{ id: generateId(), description: '', quantity: 1, unit_price: 0, vat_type: 'vatable' }],
    notes: '',
    due_date: '',
    signature_data: '',
    signature_name: '',
    customer_id: '',
    payment_link: '',
  });

  useEffect(() => {
    if (businessOwnerId) {
      fetchInvoices();
      fetchCustomers();
    }
  }, [businessOwnerId]);

  async function fetchInvoices() {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', businessOwnerId!)
      .order('created_at', { ascending: false });
    if (data) setInvoices(data as InvoiceRecord[]);
    setLoading(false);
  }

  async function fetchCustomers() {
    const { data } = await supabase
      .from('customers')
      .select('id, name, email, phone, address')
      .eq('user_id', businessOwnerId!)
      .order('name', { ascending: true });
    if (data) setCustomers(data);
  }

  function updateForm<K extends keyof InvoiceForm>(field: K, value: InvoiceForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function updateItem(id: string, field: keyof LineItem, value: any) {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addItem() {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { id: generateId(), description: '', quantity: 1, unit_price: 0, vat_type: 'vatable' }],
    }));
  }

  function removeItem(id: string) {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  }

  function selectCustomer(id: string) {
    const c = customers.find(c => c.id === id);
    if (c) {
      setForm(prev => ({
        ...prev,
        customer_id: id,
        buyer_name: c.name,
        buyer_address: c.address || '',
      }));
    }
  }

  function resetForm() {
    setForm({
      business_name: user?.name || '',
      tin: '',
      branch_code: '001',
      business_address: '',
      business_logo_url: '',
      invoice_type: 'sales',
      invoice_number: generateInvoiceNumber('sales'),
      date: new Date().toISOString().split('T')[0],
      payment_terms: 'Due upon receipt',
      buyer_name: '',
      buyer_tin: '',
      buyer_address: '',
      is_vat: true,
      items: [{ id: generateId(), description: '', quantity: 1, unit_price: 0, vat_type: 'vatable' }],
      notes: '',
      due_date: '',
      signature_data: '',
      signature_name: '',
      customer_id: '',
      payment_link: '',
    });
  }

  // Calculations
  const vatableItems = form.items.filter(i => i.vat_type === 'vatable');
  const vatExemptItems = form.items.filter(i => i.vat_type === 'vat-exempt');
  const zeroRatedItems = form.items.filter(i => i.vat_type === 'zero-rated');

  const vatableAmount = vatableItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const vatExemptAmount = vatExemptItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const zeroRatedAmount = zeroRatedItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const totalBeforeVat = vatableAmount + vatExemptAmount + zeroRatedAmount;
  const vatAmount = form.is_vat ? vatableAmount * 0.12 : 0;
  const totalDue = totalBeforeVat + vatAmount;

  // --- Signature Pad ---
  function initSignaturePad() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    signatureCtxRef.current = ctx;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function getCanvasPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const pos = getCanvasPos(e);
    const ctx = signatureCtxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getCanvasPos(e);
    const ctx = signatureCtxRef.current;
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function saveSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const pixelData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
    const isEmpty = pixelData?.every((v, i) => i % 4 === 3 || v === 255);
    if (isEmpty) {
      toast.error('Please draw your signature first');
      return;
    }
    setForm(prev => ({ ...prev, signature_data: dataUrl }));
    setSignatureDialogOpen(false);
    toast.success('Signature saved');
  }

  // --- Logo Upload ---
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setForm(prev => ({ ...prev, business_logo_url: dataUrl }));
      toast.success('Logo uploaded');
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.buyer_name) { toast.error('Buyer name is required'); return; }
    if (form.items.length === 0 || form.items.every(i => !i.description)) {
      toast.error('Add at least one item with a description');
      return;
    }

    const { error } = await supabase.from('invoices').insert({
      user_id: businessOwnerId!,
      invoice_number: form.invoice_number,
      invoice_type: form.invoice_type,
      is_vat: form.is_vat,
      branch_code: form.branch_code,
      customer_id: form.customer_id || null,
      customer_name: form.buyer_name,
      customer_tin: form.buyer_tin || null,
      customer_address: form.buyer_address || null,
      buyer_tin: form.buyer_tin || null,
      buyer_address: form.buyer_address || null,
      items: form.items,
      subtotal: totalBeforeVat,
      tax: vatAmount,
      discount: 0,
      total: totalDue,
      vatable_amount: vatableAmount,
      vat_exempt_amount: vatExemptAmount,
      zero_rated_amount: zeroRatedAmount,
      vat_amount: vatAmount,
      status: 'draft',
      payment_terms: form.payment_terms,
      notes: form.notes || null,
      due_date: form.due_date || null,
      business_name: form.business_name,
      business_address: form.business_address,
      business_logo_url: form.business_logo_url || null,
      signature_data: form.signature_data || null,
      signature_name: form.signature_name || null,
      payment_link: form.payment_link || null,
    });

    if (error) { toast.error(error.message); return; }
    toast.success('Invoice created!');
    setDialogOpen(false);
    resetForm();
    fetchInvoices();
  }

  async function updateStatus(id: string, status: InvoiceStatus) {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Invoice marked as ${status}`);
    fetchInvoices();
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Invoice deleted');
    fetchInvoices();
  }

  async function downloadPDF(invoice: InvoiceRecord) {
    setDownloading(invoice.id);
    try {
      const { buildInvoiceHTML } = await import('@/components/InvoiceTemplate');
      const { default: jsPDF } = await import('jspdf');

      const html = buildInvoiceHTML({
        invoice_number: invoice.invoice_number,
        invoice_type: invoice.invoice_type,
        is_vat: invoice.is_vat,
        branch_code: invoice.branch_code,
        customer_name: invoice.customer_name,
        customer_tin: invoice.customer_tin,
        customer_address: invoice.customer_address,
        items: invoice.items || [],
        payment_terms: invoice.payment_terms,
        notes: invoice.notes,
        created_at: invoice.created_at,
        signature_data: invoice.signature_data,
        signature_name: invoice.signature_name,
        business_name: invoice.business_name,
        business_address: invoice.business_address,
        business_logo_url: invoice.business_logo_url,
      });

      // Create a hidden iframe to render the HTML and print to PDF
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) { throw new Error('Could not create iframe'); }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await (await import('html2canvas')).default(iframeDoc.body, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(null);
    }
  }

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !searchQuery || 
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = invoices.reduce((s, i) => s + i.total, 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const pendingAmount = invoices.filter(i => i.status === 'draft' || i.status === 'sent').reduce((s, i) => s + i.total, 0);

  return (
    <BusinessLayout title="Invoices" description="Create, manage, and download BIR-compliant invoices">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{invoices.length}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Amount</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{formatCurrency(totalAmount)}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Paid</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{formatCurrency(paidAmount)}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Pending</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-800 dark:text-amber-300">{formatCurrency(pendingAmount)}</p></CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>All Invoices</CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <ExportButton
              data={filteredInvoices}
              filename="invoices"
              title="Invoices"
              columns={[
                { key: 'invoice_number', header: 'Invoice #' },
                { key: 'customer_name', header: 'Customer' },
                { key: 'invoice_type', header: 'Type', formatter: v => INVOICE_TYPE_LABELS[v as InvoiceType] || v },
                { key: 'total', header: 'Total', formatter: v => `₱${Number(v).toFixed(2)}` },
                { key: 'status', header: 'Status' },
                { key: 'created_at', header: 'Date', formatter: v => new Date(v).toLocaleDateString() },
              ]}
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={resetForm}>
                  <Plus className="w-4 h-4" /> New Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Receipt className="w-5 h-5 text-emerald-500" />
                    Create New Invoice
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  {/* Tax Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border">
                    <div>
                      <h4 className="font-semibold text-sm">Tax Status</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {form.is_vat ? 'VAT-registered — 12% VAT applied' : 'Non-VAT — No VAT computed'}
                      </p>
                    </div>
                    <button
                      onClick={() => updateForm('is_vat', !form.is_vat)}
                      className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                        form.is_vat ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                        form.is_vat ? 'translate-x-7' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  {!form.is_vat && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                        THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX
                      </p>
                    </div>
                  )}

                  {/* Invoice Type */}
                  <div className="space-y-2">
                    <Label>Invoice Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(INVOICE_TYPE_LABELS) as [InvoiceType, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            updateForm('invoice_type', key);
                            updateForm('invoice_number', generateInvoiceNumber(key));
                          }}
                          className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                            form.invoice_type === key
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      Business Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Registered Name</Label>
                        <Input value={form.business_name} onChange={e => updateForm('business_name', e.target.value)} placeholder="Business Name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Branch Code</Label>
                        <Input value={form.branch_code} onChange={e => updateForm('branch_code', e.target.value)} placeholder="001" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>TIN</Label>
                      <Input value={form.tin} onChange={e => updateForm('tin', e.target.value)} placeholder="XXX-XXX-XXX-XXX" />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Address</Label>
                      <Textarea value={form.business_address} onChange={e => updateForm('business_address', e.target.value)} placeholder="Full business address" rows={2} />
                    </div>

                    {/* Business Logo Upload */}
                    <div className="space-y-2">
                      <Label>Business Logo</Label>
                      <div className="flex items-center gap-4">
                        {form.business_logo_url ? (
                          <div className="relative">
                            <img src={form.business_logo_url} alt="Logo" className="h-14 w-14 object-contain rounded-lg border" />
                            <button
                              onClick={() => updateForm('business_logo_url', '')}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-sm text-muted-foreground">
                            <Image className="w-4 h-4" />
                            Upload Logo
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      Invoice Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Invoice #</Label>
                        <Input value={form.invoice_number} onChange={e => updateForm('invoice_number', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" value={form.due_date} onChange={e => updateForm('due_date', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Input value={form.payment_terms} onChange={e => updateForm('payment_terms', e.target.value)} placeholder="Due upon receipt" />
                    </div>
                  </div>

                  {/* Payment Link */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Payment Link <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      value={form.payment_link}
                      onChange={e => updateForm('payment_link', e.target.value)}
                      placeholder="https://gcash.com/pay/... or https://paymaya.com/link/..."
                    />
                    <p className="text-xs text-muted-foreground">Add a payment link so your customer can pay online.</p>
                  </div>

                  {/* Buyer / Customer */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Buyer / Customer
                    </h4>

                    {/* Select from existing customers */}
                    {customers.length > 0 && (
                      <div className="space-y-2">
                        <Label>Select from Customers</Label>
                        <Select value={form.customer_id} onValueChange={selectCustomer}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a customer..." />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}{c.email ? ` — ${c.email}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Buyer Name *</Label>
                      <Input value={form.buyer_name} onChange={e => updateForm('buyer_name', e.target.value)} placeholder="Buyer's full name or company" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Buyer TIN</Label>
                        <Input value={form.buyer_tin} onChange={e => updateForm('buyer_tin', e.target.value)} placeholder="XXX-XXX-XXX-XXX" />
                      </div>
                      <div className="space-y-2">
                        <Label>Buyer Address</Label>
                        <Input value={form.buyer_address} onChange={e => updateForm('buyer_address', e.target.value)} placeholder="Buyer's address" />
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      Line Items
                    </h4>
                    <div className="space-y-3">
                      {form.items.map((item, i) => (
                        <div key={item.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-4 space-y-1">
                              <Label className="text-xs text-muted-foreground">Description</Label>
                              <Input
                                value={item.description}
                                onChange={e => updateItem(item.id, 'description', e.target.value)}
                                placeholder="Item description"
                                className="text-sm"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <Label className="text-xs text-muted-foreground">Qty</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={e => updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                className="text-sm"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <Label className="text-xs text-muted-foreground">Unit Price</Label>
                              <Input
                                type="number"
                                value={item.unit_price}
                                onChange={e => updateItem(item.id, 'unit_price', Math.max(0, parseFloat(e.target.value) || 0))}
                                min="0"
                                step="0.01"
                                className="text-sm"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <Label className="text-xs text-muted-foreground">VAT Type</Label>
                              <Select value={item.vat_type} onValueChange={v => updateItem(item.id, 'vat_type', v)}>
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="vatable">VATable</SelectItem>
                                  <SelectItem value="vat-exempt">VAT-Exempt</SelectItem>
                                  <SelectItem value="zero-rated">Zero-Rated</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="sm:col-span-2 flex items-end justify-end gap-1 pb-0.5">
                              <span className="text-sm font-medium text-muted-foreground self-center">
                                {formatCurrency(item.quantity * item.unit_price)}
                              </span>
                              {form.items.length > 1 && (
                                <button onClick={() => removeItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </Button>
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-1.5 text-sm">
                    {vatableAmount > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">VATable Sales</span><span>{formatCurrency(vatableAmount)}</span></div>
                    )}
                    {vatExemptAmount > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">VAT-Exempt Sales</span><span>{formatCurrency(vatExemptAmount)}</span></div>
                    )}
                    {zeroRatedAmount > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Zero-Rated Sales</span><span>{formatCurrency(zeroRatedAmount)}</span></div>
                    )}
                    <div className="flex justify-between font-medium border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1.5">
                      <span>Total Before VAT</span>
                      <span>{formatCurrency(totalBeforeVat)}</span>
                    </div>
                    {form.is_vat && (
                      <div className="flex justify-between"><span>VAT (12%)</span><span>{formatCurrency(vatAmount)}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t-2 border-gray-900 dark:border-gray-100 pt-1.5 mt-1.5">
                      <span>Total Due</span>
                      <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(totalDue)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)} placeholder="Additional notes..." rows={2} />
                  </div>

                  {/* Signature */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <PenLine className="w-4 h-4 text-muted-foreground" />
                      Signature
                    </h4>
                    {form.signature_data ? (
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={form.signature_data} alt="Signature" className="h-16 object-contain rounded-lg border p-1" />
                          <button
                            onClick={() => setForm(prev => ({ ...prev, signature_data: '', signature_name: '' }))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                        {form.signature_name && (
                          <span className="text-sm text-muted-foreground">— {form.signature_name}</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSignatureDialogOpen(true);
                            setTimeout(initSignaturePad, 100);
                          }}
                          className="gap-2"
                        >
                          <PenLine className="w-4 h-4" />
                          Add Signature
                        </Button>
                      </div>
                    )}
                    {form.signature_data && (
                      <div className="space-y-2">
                        <Label>Signatory Name</Label>
                        <Input
                          value={form.signature_name}
                          onChange={e => updateForm('signature_name', e.target.value)}
                          placeholder="Name of authorized signatory"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} className="gap-2">
                    <Receipt className="w-4 h-4" /> Create Invoice
                  </Button>
                </div>

                {/* Signature Pad Dialog */}
                <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <PenLine className="w-4 h-4" />
                        Draw Your Signature
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div
                        className="border-2 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden cursor-crosshair touch-none"
                        style={{ width: '100%', height: 200 }}
                      >
                        <canvas
                          ref={canvasRef}
                          width={500}
                          height={200}
                          style={{ width: '100%', height: '100%' }}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Signatory name"
                          value={form.signature_name}
                          onChange={e => updateForm('signature_name', e.target.value)}
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={clearSignature} className="gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Clear
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSignatureDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={saveSignature}>
                            Save Signature
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{searchQuery || statusFilter !== 'all' ? 'No invoices match your filters' : 'No invoices yet. Create your first one!'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map(inv => {
                    const StatusIcon = STATUS_CONFIG[inv.status].icon;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono font-medium text-sm">{inv.invoice_number}</TableCell>
                        <TableCell>{inv.customer_name || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {INVOICE_TYPE_LABELS[inv.invoice_type] || inv.invoice_type}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(inv.total)}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_CONFIG[inv.status].variant} className="gap-1 capitalize">
                            <StatusIcon className="w-3 h-3" />
                            {STATUS_CONFIG[inv.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => downloadPDF(inv)}
                              disabled={downloading === inv.id}
                              title="Download PDF"
                            >
                              {downloading === inv.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                            {inv.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600"
                                onClick={() => updateStatus(inv.id, 'sent')}
                                title="Mark as Sent"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            {inv.status === 'sent' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600"
                                onClick={() => updateStatus(inv.id, 'paid')}
                                title="Mark as Paid"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            {(inv.status === 'draft' || inv.status === 'sent') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => updateStatus(inv.id, 'cancelled')}
                                title="Cancel Invoice"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => deleteInvoice(inv.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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
