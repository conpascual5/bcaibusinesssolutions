import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/currency';
import { Search, FileText, Eye, Printer } from 'lucide-react';
import { TableSkeleton } from '@/components/BusinessSkeleton';
import ExportButton from '@/components/ExportButton';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  customer_email: string | null;
  items: any[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  created_at: string;
}

export default function BusinessReceipts() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (user) fetchInvoices();
  }, [user]);

  async function fetchInvoices() {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setInvoices(data);
    setLoading(false);
  }

  const filtered = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <BusinessLayout title="Receipt Listing" description="Track and view all invoices and receipts">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Receipts</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{invoices.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{invoices.filter(i => i.status === 'paid').length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{invoices.filter(i => i.status === 'sent').length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search receipts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <ExportButton
            data={filtered}
            filename="receipts"
            title="Receipt Listing"
            columns={[
              { key: 'invoice_number', header: 'Receipt #' },
              { key: 'customer_name', header: 'Customer', formatter: v => v || '—' },
              { key: 'created_at', header: 'Date', formatter: v => new Date(v).toLocaleDateString() },
              { key: 'total', header: 'Total', formatter: v => `₱${v.toFixed(2)}` },
              { key: 'status', header: 'Status' },
            ]}
          />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{search ? 'No receipts match' : 'No receipts yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
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
                      <TableCell className="text-right font-medium">{formatCurrency(inv.total)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'sent' ? 'secondary' : 'outline'} className="capitalize">
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setPreviewInvoice(inv)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Preview */}
      <Dialog open={!!previewInvoice} onOpenChange={(open) => { if (!open) setPreviewInvoice(null); }}>
        <DialogContent className="sm:max-w-lg">
          {previewInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>Receipt {previewInvoice.invoice_number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="font-semibold">{previewInvoice.customer_name || 'Customer'}</p>
                  {previewInvoice.customer_email && <p className="text-sm text-muted-foreground">{previewInvoice.customer_email}</p>}
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
