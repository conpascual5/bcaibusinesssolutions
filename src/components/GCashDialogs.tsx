import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/currency';
import { Smartphone, RefreshCw, Plus, ArrowDownCircle, ArrowUpCircle, CreditCard } from 'lucide-react';

const TRANSACTION_TYPES = [
  { value: 'cash_in', label: 'Cash In', icon: ArrowDownCircle, color: 'text-emerald-600' },
  { value: 'cash_out', label: 'Cash Out', icon: ArrowUpCircle, color: 'text-rose-600' },
  { value: 'float_replenish', label: 'Float Replenish', icon: RefreshCw, color: 'text-blue-600' },
  { value: 'transfer', label: 'Transfer', icon: CreditCard, color: 'text-purple-600' },
];

interface TxForm {
  transaction_type: string;
  amount: string;
  fee: string;
  reference_number: string;
  customer_name: string;
  payment_status: 'paid' | 'unpaid';
  notes: string;
  transaction_date: string;
}

interface ReplenishForm {
  amount: string;
  fee: string;
  reference_number: string;
  notes: string;
}

interface ReconForm {
  digital_wallet_balance: string;
  physical_cash_drawer: string;
  notes: string;
}

export function NewTransactionDialog({
  open, onOpenChange, form, setForm, onSave
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: TxForm; setForm: (f: TxForm) => void; onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Transaction</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-500" /> Record GCash Transaction
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Transaction Type *</Label>
            <Select value={form.transaction_type} onValueChange={v => setForm({ ...form, transaction_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2"><t.icon className="w-4 h-4" /> {t.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (₱) *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fee (₱)</Label>
              <Input type="number" step="0.01" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input value={form.reference_number} onChange={e => setForm({ ...form, reference_number: e.target.value })} placeholder="13-digit GCash ref #" maxLength={13} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="For utang tracking" />
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={form.payment_status} onValueChange={v => setForm({ ...form, payment_status: v as 'paid' | 'unpaid' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid (Utang)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          {form.amount && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Amount</span><span className="font-bold">{formatCurrency(parseFloat(form.amount) || 0)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Fee</span><span>{formatCurrency(parseFloat(form.fee) || 0)}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span>Net Amount</span><span className="font-bold">{formatCurrency((parseFloat(form.amount) || 0) - (parseFloat(form.fee) || 0))}</span></div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>Save Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReplenishDialog({
  open, onOpenChange, form, setForm, onSave
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: ReplenishForm; setForm: (f: ReplenishForm) => void; onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Replenish Float
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-500" /> Capital Replenishment
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Log when you add cash to your GCash wallet (e.g., via 7-Eleven, bank transfer). The 2% fee is deducted from your net profit.
        </p>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Amount to Replenish (₱) *</Label>
            <Input type="number" step="0.01" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 1000" />
          </div>
          <div className="space-y-2">
            <Label>Cash-In Fee (₱) — usually 2%</Label>
            <Input type="number" step="0.01" value={form.fee}
              onChange={e => setForm({ ...form, fee: e.target.value })} placeholder="e.g. 20" />
            {form.amount && (
              <p className="text-xs text-muted-foreground">
                Suggested 2% fee: ₱{(parseFloat(form.amount) * 0.02).toFixed(2)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Reference Number</Label>
            <Input value={form.reference_number}
              onChange={e => setForm({ ...form, reference_number: e.target.value })} placeholder="GCash ref #" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Replenished at 7-Eleven" />
          </div>
          {form.amount && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Replenish Amount</span><span className="font-bold">{formatCurrency(parseFloat(form.amount) || 0)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Fee</span><span>{formatCurrency(parseFloat(form.fee) || 0)}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span>Total Cost</span><span className="font-bold text-rose-600">{formatCurrency((parseFloat(form.amount) || 0) + (parseFloat(form.fee) || 0))}</span></div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>Log Replenishment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReconciliationDialog({
  open, onOpenChange, form, setForm, onSave
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: ReconForm; setForm: (f: ReconForm) => void; onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-green-500" /> End-of-Day Reconciliation
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Enter your actual balances from the GCash app and your cash drawer. The system will compare them against expected values based on today's transactions.
        </p>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>GCash App Balance (₱) *</Label>
            <Input type="number" step="0.01" value={form.digital_wallet_balance}
              onChange={e => setForm({ ...form, digital_wallet_balance: e.target.value })} placeholder="e.g. 5000" />
          </div>
          <div className="space-y-2">
            <Label>Physical Cash in Drawer (₱) *</Label>
            <Input type="number" step="0.01" value={form.physical_cash_drawer}
              onChange={e => setForm({ ...form, physical_cash_drawer: e.target.value })} placeholder="e.g. 12000" />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any discrepancies or notes" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>Save Reconciliation</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
