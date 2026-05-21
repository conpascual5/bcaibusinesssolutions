import { useState, useRef } from 'react';
import { useAuth } from '@/providers/auth';
import {
  FileText,
  Sparkles,
  FileDown,
  Plus,
  Trash2,
  Printer,
  Building2,
  User,
  Hash,
  Calendar,
  DollarSign,
  Receipt,
  Info,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Crown,
  Grid3X3,
} from "lucide-react";
import MarketingToolkitDrawer from "@/components/MarketingToolkitDrawer";

type InvoiceType = 'sales' | 'cash' | 'charge';
type VatType = 'vatable' | 'vat-exempt' | 'zero-rated';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatType: VatType;
}

interface InvoiceData {
  // Business details
  businessName: string;
  tin: string;
  branchCode: string;
  businessAddress: string;
  // Invoice details
  invoiceType: InvoiceType;
  invoiceNumber: string;
  date: string;
  paymentTerms: string;
  // Buyer details
  buyerName: string;
  buyerTin: string;
  buyerAddress: string;
  buyerOver1000: boolean;
  // Items
  items: LineItem[];
  // Settings
  isVat: boolean;
  // Payment link
  paymentLink: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  sales: 'Sales Invoice',
  cash: 'Cash Invoice',
  charge: 'Charge Invoice',
};

export default function Invoices() {
  const { user } = useAuth();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const [invoice, setInvoice] = useState<InvoiceData>({
    businessName: user?.name || '',
    tin: '',
    branchCode: '001',
    businessAddress: '',
    invoiceType: 'sales',
    invoiceNumber: `SI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    date: new Date().toISOString().split('T')[0],
    paymentTerms: 'Due upon receipt',
    buyerName: '',
    buyerTin: '',
    buyerAddress: '',
    buyerOver1000: false,
    items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, vatType: 'vatable' }],
    isVat: true,
    paymentLink: '',
  });

  const update = <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, vatType: 'vatable' }],
    }));
  };

  const removeItem = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };

  // Calculations
  const vatableItems = invoice.items.filter(i => i.vatType === 'vatable');
  const vatExemptItems = invoice.items.filter(i => i.vatType === 'vat-exempt');
  const zeroRatedItems = invoice.items.filter(i => i.vatType === 'zero-rated');

  const vatableAmount = vatableItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const vatExemptAmount = vatExemptItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const zeroRatedAmount = zeroRatedItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const totalAmountBeforeVat = vatableAmount + vatExemptAmount + zeroRatedAmount;
  const vatAmount = invoice.isVat ? vatableAmount * 0.12 : 0;
  const totalAmountDue = totalAmountBeforeVat + vatAmount;

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;

    setDownloading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Receipt className="w-3 h-3" /> BIR-Compliant
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Free — Unlimited
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Philippine Invoice Generator</h1>
            <p className="text-gray-500 mt-1 max-w-2xl">
              Generate BIR-compliant Sales, Cash, or Charge Invoices with VAT/Non-VAT support. Download as PDF. <strong>Free and unlimited for all users.</strong>
            </p>
          </div>
          <div className="shrink-0">
            <MarketingToolkitDrawer>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
                <Grid3X3 className="w-3.5 h-3.5" />
                Tools
              </button>
            </MarketingToolkitDrawer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ===== FORM ===== */}
        <div className="space-y-5">
          {/* VAT / Non-VAT Toggle */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Tax Status</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {invoice.isVat ? 'VAT-registered — 12% VAT will be applied' : 'Non-VAT — No VAT will be computed'}
                </p>
              </div>
              <button
                onClick={() => update('isVat', !invoice.isVat)}
                className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                  invoice.isVat ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    invoice.isVat ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {!invoice.isVat && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium">
                  THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX
                </p>
              </div>
            )}
          </div>

          {/* Invoice Type */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-500" />
              Invoice Type
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(INVOICE_TYPE_LABELS) as [InvoiceType, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => update('invoiceType', key)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    invoice.invoiceType === key
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              Business Details
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Registered Name</label>
                  <input
                    type="text"
                    value={invoice.businessName}
                    onChange={e => update('businessName', e.target.value)}
                    placeholder="Business Name"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Branch Code</label>
                  <input
                    type="text"
                    value={invoice.branchCode}
                    onChange={e => update('branchCode', e.target.value)}
                    placeholder="001"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">TIN</label>
                <input
                  type="text"
                  value={invoice.tin}
                  onChange={e => update('tin', e.target.value)}
                  placeholder="XXX-XXX-XXX-XXX"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Business Address</label>
                <textarea
                  value={invoice.businessAddress}
                  onChange={e => update('businessAddress', e.target.value)}
                  placeholder="Full business address"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-500" />
              Invoice Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Invoice #</label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={e => update('invoiceNumber', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Date</label>
                <input
                  type="date"
                  value={invoice.date}
                  onChange={e => update('date', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Payment Terms</label>
                <input
                  type="text"
                  value={invoice.paymentTerms}
                  onChange={e => update('paymentTerms', e.target.value)}
                  placeholder="Due upon receipt"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Payment Link */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Payment Link
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-medium mb-1 block">
                Payment URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={invoice.paymentLink}
                onChange={e => update('paymentLink', e.target.value)}
                placeholder="https://gcash.com/pay/... or https://paymaya.com/link/..."
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
              />
              <p className="text-xs text-gray-400">Add a payment link so your customer can pay online (GCash, PayMaya, bank portal, etc.)</p>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Buyer / Customer
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Buyer Name</label>
                <input
                  type="text"
                  value={invoice.buyerName}
                  onChange={e => update('buyerName', e.target.value)}
                  placeholder="Buyer's full name or company"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Buyer TIN</label>
                <input
                  type="text"
                  value={invoice.buyerTin}
                  onChange={e => update('buyerTin', e.target.value)}
                  placeholder="XXX-XXX-XXX-XXX"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Buyer Address</label>
                <textarea
                  value={invoice.buyerAddress}
                  onChange={e => update('buyerAddress', e.target.value)}
                  placeholder="Buyer's full address"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm resize-none"
                />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invoice.buyerOver1000}
                  onChange={e => update('buyerOver1000', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Amount is ₱1,000 or more</span>
                  <p className="text-xs text-gray-400">Buyer name, TIN, and address are required by BIR for transactions ≥ ₱1,000</p>
                </div>
              </label>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Line Items
            </h3>
            <div className="space-y-3">
              {invoice.items.map((item, i) => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <label className="text-xs text-gray-400 mb-1 block">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Goods or service description"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-400 transition-all text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-400 transition-all text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">Unit Price</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={e => updateItem(item.id, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-400 transition-all text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">VAT Type</label>
                      <select
                        value={item.vatType}
                        onChange={e => updateItem(item.id, 'vatType', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-400 transition-all text-sm appearance-none"
                      >
                        <option value="vatable">VATable</option>
                        <option value="vat-exempt">VAT-Exempt</option>
                        <option value="zero-rated">Zero-Rated</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1 flex items-end justify-end pb-2">
                      {invoice.items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-700 font-medium mt-1">
                    Amount: {formatCurrency(item.quantity * item.unitPrice)}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {/* Download */}
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 text-base"
          >
            {downloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5" />
                Download PDF Invoice
              </>
            )}
          </button>
        </div>

        {/* ===== PREVIEW ===== */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Live Preview
              </h3>
              <span className="text-xs text-gray-400">A4 — BIR format</span>
            </div>
            <div className="p-4 overflow-auto max-h-[900px]">
              <div
                ref={invoiceRef}
                className="bg-white border border-gray-200 shadow-sm mx-auto"
                style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm' }}
              >
                {/* === TOP SECTION: Business Info + Invoice Type === */}
                <div className="flex justify-between items-start mb-6">
                  <div className="max-w-[60%]">
                    <p className="text-lg font-bold text-gray-900 leading-tight">{invoice.businessName || 'Business Name'}</p>
                    {invoice.tin && <p className="text-xs text-gray-600 mt-1">TIN: {invoice.tin}</p>}
                    {invoice.businessAddress && <p className="text-xs text-gray-500 mt-0.5">{invoice.businessAddress}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-gray-900 leading-tight">{INVOICE_TYPE_LABELS[invoice.invoiceType]}</p>
                    <p className="text-xs text-gray-500 mt-1">Branch: {invoice.branchCode}</p>
                  </div>
                </div>

                <div className="border-b-2 border-gray-900 mb-4" />

                {/* === INVOICE INFO === */}
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-xs text-gray-500">Invoice No.</p>
                    <p className="text-sm font-bold text-gray-900">{invoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(invoice.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* === BUYER === */}
                <div className="mb-6 p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bill To</p>
                  <p className="text-sm font-bold text-gray-900">{invoice.buyerName || 'Buyer Name'}</p>
                  {invoice.buyerTin && <p className="text-xs text-gray-600">TIN: {invoice.buyerTin}</p>}
                  {invoice.buyerAddress && <p className="text-xs text-gray-500">{invoice.buyerAddress}</p>}
                </div>

                {/* === ITEMS TABLE === */}
                <table className="w-full mb-4" style={{ fontSize: '9pt' }}>
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="text-left font-bold text-gray-900 pb-2 w-[45%]">Description</th>
                      <th className="text-right font-bold text-gray-900 pb-2 w-[12%]">Qty</th>
                      <th className="text-right font-bold text-gray-900 pb-2 w-[18%]">Unit Price</th>
                      <th className="text-right font-bold text-gray-900 pb-2 w-[12%]">VAT Type</th>
                      <th className="text-right font-bold text-gray-900 pb-2 w-[13%]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, i) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-2 text-sm text-gray-900">{item.description || '—'}</td>
                        <td className="py-2 text-sm text-gray-700 text-right">{item.quantity}</td>
                        <td className="py-2 text-sm text-gray-700 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 text-xs text-gray-500 text-right">
                          {item.vatType === 'vatable' ? 'VATable' : item.vatType === 'vat-exempt' ? 'VAT-Ex' : 'Zero-Rtd'}
                        </td>
                        <td className="py-2 text-sm text-gray-900 font-medium text-right">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                    {invoice.items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-sm text-gray-400">No items added</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* === TOTALS === */}
                <div className="flex justify-end mb-6">
                  <div style={{ width: '55%' }}>
                    {/* VAT Breakdown */}
                    {vatableAmount > 0 && (
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-gray-600">VATable Sales</span>
                        <span className="text-gray-900">{formatCurrency(vatableAmount)}</span>
                      </div>
                    )}
                    {vatExemptAmount > 0 && (
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-gray-600">VAT-Exempt Sales</span>
                        <span className="text-gray-900">{formatCurrency(vatExemptAmount)}</span>
                      </div>
                    )}
                    {zeroRatedAmount > 0 && (
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-gray-600">Zero-Rated Sales</span>
                        <span className="text-gray-900">{formatCurrency(zeroRatedAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm py-1 border-t border-gray-300">
                      <span className="text-gray-700 font-medium">Total Amount Before VAT</span>
                      <span className="text-gray-900 font-medium">{formatCurrency(totalAmountBeforeVat)}</span>
                    </div>
                    {invoice.isVat && (
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-gray-700">VAT (12%)</span>
                        <span className="text-gray-900">{formatCurrency(vatAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold py-2 border-t-2 border-gray-900 mt-1">
                      <span className="text-gray-900">Total Amount Due</span>
                      <span className="text-gray-900">{formatCurrency(totalAmountDue)}</span>
                    </div>
                  </div>
                </div>

                {/* === NON-VAT DISCLAIMER === */}
                {!invoice.isVat && (
                  <div className="mb-4 p-2.5 border-2 border-red-500 rounded">
                    <p className="text-xs font-bold text-red-600 text-center uppercase tracking-wide">
                      THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX
                    </p>
                  </div>
                )}

                {/* === PAYMENT TERMS === */}
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold">Payment Terms:</span> {invoice.paymentTerms}
                  </p>
                </div>

                {/* === PAYMENT LINK === */}
                {invoice.paymentLink && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Pay Online</p>
                    <a
                      href={invoice.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline break-all hover:text-blue-800"
                    >
                      {invoice.paymentLink}
                    </a>
                  </div>
                )}

                {/* === FOOTER === */}
                <div className="mt-6 pt-3 border-t border-gray-200 text-center">
                  <p className="text-[7pt] text-gray-400">
                    This is a computer-generated document. No signature required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
