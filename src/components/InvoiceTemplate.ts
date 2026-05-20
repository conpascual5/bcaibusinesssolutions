import { formatCurrency } from '@/lib/currency';

type InvoiceType = 'sales' | 'cash' | 'charge';
type VatType = 'vatable' | 'vat-exempt' | 'zero-rated';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_type: VatType;
}

interface InvoiceData {
  invoice_number: string;
  invoice_type: string;
  is_vat: boolean;
  branch_code: string | null;
  customer_name: string | null;
  customer_tin: string | null;
  customer_address: string | null;
  items: any[];
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
  signature_data: string | null;
  signature_name: string | null;
  business_name: string | null;
  business_address: string | null;
  business_logo_url: string | null;
  payment_link?: string | null;
}

const INVOICE_TYPE_LABELS: Record<string, string> = {
  sales: 'Sales Invoice',
  cash: 'Cash Invoice',
  charge: 'Charge Invoice',
};

function escHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export function buildInvoiceHTML(inv: InvoiceData): string {
  const items = (inv.items || []) as LineItem[];
  const vatItems = items.filter(i => i.vat_type === 'vatable');
  const exemptItems = items.filter(i => i.vat_type === 'vat-exempt');
  const zeroItems = items.filter(i => i.vat_type === 'zero-rated');
  const vatAmt = vatItems.reduce((s, i) => s + i.quantity * i.unit_price, 0) * (inv.is_vat ? 0.12 : 0);
  const vatTotal = vatItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const exemptTotal = exemptItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const zeroTotal = zeroItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const totalBeforeVat = vatTotal + exemptTotal + zeroTotal;
  const totalDue = totalBeforeVat + vatAmt;

  const typeLabel = INVOICE_TYPE_LABELS[inv.invoice_type] || 'Sales Invoice';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #1a1a2e; }
    .page { width: 170mm; margin: 0 auto; padding: 15mm 20mm; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-start { align-items: flex-start; }
    .items-end { align-items: flex-end; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .border-b { border-bottom: 2px solid #1a1a2e; }
    .border-b-light { border-bottom: 1px solid #ddd; }
    .border-red { border: 2px solid #dc2626; }
    .rounded { border-radius: 2mm; }
    .bg-gray { background: #f8f8f8; }
    .mb-6 { margin-bottom: 6mm; }
    .mb-4 { margin-bottom: 4mm; }
    .mt-4 { margin-top: 4mm; }
    .mt-6 { margin-top: 6mm; }
    .pt-3 { padding-top: 3mm; }
    .p-3 { padding: 3mm; }
    .p-2 { padding: 2.5mm; }
    .w-55 { width: 55%; }
    .max-w-60 { max-width: 60%; }
    .text-xs { font-size: 8pt; }
    .text-sm { font-size: 9pt; }
    .text-base { font-size: 10pt; }
    .text-lg { font-size: 14pt; }
    .text-xl { font-size: 16pt; }
    .font-bold { font-weight: bold; }
    .font-extrabold { font-weight: 800; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .text-gray { color: #888; }
    .text-gray-dark { color: #555; }
    .text-gray-light { color: #aaa; }
    .text-red { color: #dc2626; }
    .uppercase { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.5px; }
    .leading-tight { line-height: 1.2; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    th { text-align: left; font-weight: bold; padding-bottom: 2mm; border-bottom: 2px solid #1a1a2e; }
    td { padding: 2mm 0; border-bottom: 1px solid #ddd; }
    img.logo { height: 40px; object-fit: contain; margin-bottom: 4px; }
    img.sig { height: 40px; object-fit: contain; }
  </style></head><body>
    <div class="page">
      <div class="flex justify-between items-start mb-6">
        <div class="max-w-60">
          ${inv.business_logo_url ? `<img src="${escHtml(inv.business_logo_url)}" class="logo" />` : ''}
          <p class="text-lg font-bold leading-tight" style="margin:0">${escHtml(inv.business_name || 'Business Name')}</p>
          ${inv.customer_tin ? `<p class="text-xs text-gray-dark" style="margin:2px 0 0">TIN: ${escHtml(inv.customer_tin)}</p>` : ''}
          ${inv.business_address ? `<p class="text-xs text-gray" style="margin:1px 0 0">${escHtml(inv.business_address)}</p>` : ''}
        </div>
        <div class="text-right">
          <p class="text-xl font-extrabold leading-tight" style="margin:0">${typeLabel}</p>
          <p class="text-xs text-gray" style="margin:2px 0 0">Branch: ${escHtml(inv.branch_code || '001')}</p>
        </div>
      </div>
      <div class="border-b mb-6"></div>
      <div class="flex justify-between items-end mb-6">
        <div>
          <p class="text-xs text-gray" style="margin:0">Invoice No.</p>
          <p class="text-sm font-bold" style="margin:1px 0 0">${escHtml(inv.invoice_number)}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray" style="margin:0">Date</p>
          <p class="text-sm font-bold" style="margin:1px 0 0">${new Date(inv.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      <div class="bg-gray rounded p-3 mb-6" style="border:1px solid #ddd">
        <p class="text-xs font-semibold text-gray uppercase tracking-wide" style="margin:0 0 2px">Bill To</p>
        <p class="text-sm font-bold" style="margin:0">${escHtml(inv.customer_name || 'Buyer Name')}</p>
        ${inv.customer_tin ? `<p class="text-xs text-gray-dark" style="margin:1px 0 0">TIN: ${escHtml(inv.customer_tin)}</p>` : ''}
        ${inv.customer_address ? `<p class="text-xs text-gray" style="margin:1px 0 0">${escHtml(inv.customer_address)}</p>` : ''}
      </div>
      <table class="mb-6">
        <thead>
          <tr>
            <th style="width:45%">Description</th>
            <th class="text-right" style="width:12%">Qty</th>
            <th class="text-right" style="width:18%">Unit Price</th>
            <th class="text-right" style="width:12%">VAT Type</th>
            <th class="text-right" style="width:13%">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${escHtml(item.description || '\u2014')}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.unit_price)}</td>
              <td class="text-right text-xs text-gray">${item.vat_type === 'vatable' ? 'VATable' : item.vat_type === 'vat-exempt' ? 'VAT-Ex' : 'Zero-Rtd'}</td>
              <td class="text-right font-medium">${formatCurrency(item.quantity * item.unit_price)}</td>
            </tr>
          `).join('')}
          ${items.length === 0 ? '<tr><td colspan="5" style="padding:4mm 0;text-align:center;color:#aaa">No items added</td></tr>' : ''}
        </tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-bottom:6mm">
        <div class="w-55">
          ${vatTotal > 0 ? `<div style="display:flex;justify-content:space-between;font-size:8pt;padding:1mm 0"><span style="color:#666">VATable Sales</span><span>${formatCurrency(vatTotal)}</span></div>` : ''}
          ${exemptTotal > 0 ? `<div style="display:flex;justify-content:space-between;font-size:8pt;padding:1mm 0"><span style="color:#666">VAT-Exempt Sales</span><span>${formatCurrency(exemptTotal)}</span></div>` : ''}
          ${zeroTotal > 0 ? `<div style="display:flex;justify-content:space-between;font-size:8pt;padding:1mm 0"><span style="color:#666">Zero-Rated Sales</span><span>${formatCurrency(zeroTotal)}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;font-size:9pt;padding:1mm 0;border-top:1px solid #ccc">
            <span style="font-weight:500">Total Amount Before VAT</span>
            <span style="font-weight:500">${formatCurrency(totalBeforeVat)}</span>
          </div>
          ${inv.is_vat ? `<div style="display:flex;justify-content:space-between;font-size:9pt;padding:1mm 0"><span>VAT (12%)</span><span>${formatCurrency(vatAmt)}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;font-size:11pt;font-weight:bold;padding:2mm 0;border-top:2px solid #1a1a2e;margin-top:1mm">
            <span>Total Amount Due</span>
            <span>${formatCurrency(totalDue)}</span>
          </div>
        </div>
      </div>
      ${!inv.is_vat ? `
        <div class="border-red rounded p-2 mb-6">
          <p class="text-xs font-bold text-red text-center uppercase tracking-wide" style="margin:0">THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX</p>
        </div>
      ` : ''}
      <div class="border-b-light pt-3">
        <p class="text-xs text-gray" style="margin:0"><span class="font-semibold">Payment Terms:</span> ${escHtml(inv.payment_terms || 'Due upon receipt')}</p>
      </div>
      ${inv.signature_data ? `
        <div class="border-b-light mt-4 pt-3 flex" style="align-items:center;gap:3mm">
          <div>
            <img src="${escHtml(inv.signature_data)}" class="sig" />
            ${inv.signature_name ? `<p class="text-xs text-gray" style="margin:1px 0 0">${escHtml(inv.signature_name)}</p>` : ''}
          </div>
          <div class="text-xs text-gray">
            <p class="font-semibold" style="color:#333;margin:0">Authorized Signature</p>
          </div>
        </div>
      ` : ''}
      ${inv.notes ? `
        <div class="border-b-light mt-4 pt-3">
          <p class="text-xs font-semibold" style="color:#333;margin:0 0 1mm">Notes:</p>
          <p class="text-xs text-gray" style="margin:0">${escHtml(inv.notes)}</p>
        </div>
      ` : ''}
      <div class="mt-6 pt-3 border-b-light text-center">
        <p class="text-xs text-gray-light" style="margin:0">This is a computer-generated document. No signature required.</p>
      </div>
    </div>
  </body></html>`;
}
