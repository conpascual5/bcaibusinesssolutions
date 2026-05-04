import { useState, useRef } from 'react';
import { useAuth } from '@/providers/auth';
import {
  FileText,
  Sparkles,
  Download,
  Image as ImageIcon,
  FileDown,
  Plus,
  Trash2,
  Check,
  Printer,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  fromName: string;
  fromEmail: string;
  fromAddress: string;
  fromPhone: string;
  toName: string;
  toEmail: string;
  toAddress: string;
  items: LineItem[];
  notes: string;
  taxRate: number;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function Invoices() {
  const { user } = useAuth();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<'pdf' | 'image' | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fromName: user?.name || 'Your Name',
    fromEmail: user?.email || '',
    fromAddress: '',
    fromPhone: '',
    toName: '',
    toEmail: '',
    toAddress: '',
    items: [{ id: generateId(), description: '', quantity: 1, rate: 0 }],
    notes: 'Thank you for your business!',
    taxRate: 0,
  });

  const updateInvoice = (field: keyof InvoiceData, value: any) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { id: generateId(), description: '', quantity: 1, rate: 0 }],
    }));
  };

  const removeItem = (id: string) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = subtotal * (invoice.taxRate / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    setDownloading('pdf');

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
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
      setDownloading(null);
    }
  };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    setDownloading('image');

    try {
      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${invoice.invoiceNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Image download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <FileText className="w-3 h-3" /> Free Tool
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoice Generator</h1>
        <p className="text-gray-500 mt-1 max-w-xl">
          Create professional invoices and download them as PDF or image.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-5">
          {/* From */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              From (Your Details)
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={invoice.fromName}
                onChange={(e) => updateInvoice('fromName', e.target.value)}
                placeholder="Your Name / Company"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
              />
              <input
                type="email"
                value={invoice.fromEmail}
                onChange={(e) => updateInvoice('fromEmail', e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
              />
              <input
                type="text"
                value={invoice.fromPhone}
                onChange={(e) => updateInvoice('fromPhone', e.target.value)}
                placeholder="Phone"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
              />
              <textarea
                value={invoice.fromAddress}
                onChange={(e) => updateInvoice('fromAddress', e.target.value)}
                placeholder="Address"
                rows={2}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm resize-none"
              />
            </div>
          </div>

          {/* To */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Bill To
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={invoice.toName}
                onChange={(e) => updateInvoice('toName', e.target.value)}
                placeholder="Client Name / Company"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
              />
              <input
                type="email"
                value={invoice.toEmail}
                onChange={(e) => updateInvoice('toEmail', e.target.value)}
                placeholder="Client Email"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
              />
              <textarea
                value={invoice.toAddress}
                onChange={(e) => updateInvoice('toAddress', e.target.value)}
                placeholder="Client Address"
                rows={2}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm resize-none"
              />
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
                  onChange={(e) => updateInvoice('invoiceNumber', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Date</label>
                <input
                  type="date"
                  value={invoice.date}
                  onChange={(e) => updateInvoice('date', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Due Date</label>
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => updateInvoice('dueDate', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                />
              </div>
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
                <div key={item.id} className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="col-span-12 sm:col-span-6 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="Qty"
                      min="1"
                      className="col-span-4 sm:col-span-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                    />
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="Rate"
                      min="0"
                      step="0.01"
                      className="col-span-4 sm:col-span-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                    />
                    <div className="col-span-4 sm:col-span-2 flex items-center justify-end text-sm text-gray-700 font-medium px-2">
                      {formatCurrency(item.quantity * item.rate)}
                    </div>
                  </div>
                  {invoice.items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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

            {/* Tax */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Tax Rate (%)</label>
                <input
                  type="number"
                  value={invoice.taxRate}
                  onChange={(e) => updateInvoice('taxRate', Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  max="100"
                  step="0.5"
                  className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm text-center"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Notes</h3>
            <textarea
              value={invoice.notes}
              onChange={(e) => updateInvoice('notes', e.target.value)}
              placeholder="Payment terms, thank you note, etc."
              rows={2}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm resize-none"
            />
          </div>

          {/* Download Buttons */}
          <div className="flex gap-3">
            <button
              onClick={downloadPDF}
              disabled={downloading !== null}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
            >
              {downloading === 'pdf' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown className="w-5 h-5" />
              )}
              Download PDF
            </button>
            <button
              onClick={downloadImage}
              disabled={downloading !== null}
              className="flex-1 py-3 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {downloading === 'image' ? (
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
              Download Image
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Preview
              </h3>
              <span className="text-xs text-gray-400">A4 size</span>
            </div>
            <div className="p-5 overflow-auto max-h-[800px]">
              <div
                ref={invoiceRef}
                className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm"
                style={{ minHeight: '600px' }}
              >
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">Date: {new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-xs text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* From / To */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">From</p>
                    <p className="text-sm font-bold text-gray-900">{invoice.fromName || 'Your Name'}</p>
                    {invoice.fromEmail && <p className="text-xs text-gray-500">{invoice.fromEmail}</p>}
                    {invoice.fromPhone && <p className="text-xs text-gray-500">{invoice.fromPhone}</p>}
                    {invoice.fromAddress && <p className="text-xs text-gray-500 mt-1">{invoice.fromAddress}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
                    <p className="text-sm font-bold text-gray-900">{invoice.toName || 'Client Name'}</p>
                    {invoice.toEmail && <p className="text-xs text-gray-500">{invoice.toEmail}</p>}
                    {invoice.toAddress && <p className="text-xs text-gray-500 mt-1">{invoice.toAddress}</p>}
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-6">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">Description</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">Qty</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">Rate</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, i) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 text-sm text-gray-900">{item.description || '—'}</td>
                        <td className="py-3 text-sm text-gray-700 text-right">{item.quantity}</td>
                        <td className="py-3 text-sm text-gray-700 text-right">{formatCurrency(item.rate)}</td>
                        <td className="py-3 text-sm text-gray-900 font-medium text-right">{formatCurrency(item.quantity * item.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                  <div className="w-64 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    {invoice.taxRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax ({invoice.taxRate}%)</span>
                        <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t-2 border-gray-900 pt-1.5">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
