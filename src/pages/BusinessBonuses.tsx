import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Gift, DollarSign, Calendar } from "lucide-react";

type Bonus = {
  id: string;
  employee_id: string;
  bonus_type: string;
  amount: number;
  description: string | null;
  bonus_date: string;
  payroll_id: string | null;
  is_taxable: boolean;
  status: string;
};

type Employee = { id: string; first_name: string; last_name: string };

const BONUS_TYPES = [
  { value: "performance", label: "Performance Bonus" },
  { value: "13th_month", label: "13th Month Pay" },
  { value: "14th_month", label: "14th Month Pay" },
  { value: "christmas", label: "Christmas Bonus" },
  { value: "midyear", label: "Midyear Bonus" },
  { value: "attendance", label: "Attendance Bonus" },
  { value: "referral", label: "Referral Bonus" },
  { value: "signing", label: "Signing Bonus" },
  { value: "commission", label: "Commission" },
  { value: "other", label: "Other" },
];

export default function BusinessBonuses() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Bonus | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employee_id: "", bonus_type: "performance", amount: "", description: "", bonus_date: new Date().toISOString().split("T")[0], is_taxable: true });

  const loadData = async () => {
    if (!businessOwnerId) return;
    const [bonRes, empRes] = await Promise.all([
      supabase.from("hr_bonuses").select("*").order("bonus_date", { ascending: false }),
      supabase.from("hr_employees").select("id, first_name, last_name").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
    ]);
    if (bonRes.data) setBonuses(bonRes.data);
    if (empRes.data) setEmployees(empRes.data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

  const resetForm = () => {
    setForm({ employee_id: "", bonus_type: "performance", amount: "", description: "", bonus_date: new Date().toISOString().split("T")[0], is_taxable: true });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (b: Bonus) => {
    setForm({ employee_id: b.employee_id, bonus_type: b.bonus_type, amount: b.amount.toString(), description: b.description || "", bonus_date: b.bonus_date, is_taxable: b.is_taxable });
    setEditing(b);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.employee_id || !form.amount || !businessOwnerId) return;
    setSaving(true);
    const payload = {
      business_id: businessOwnerId, employee_id: form.employee_id, bonus_type: form.bonus_type,
      amount: parseFloat(form.amount), description: form.description || null,
      bonus_date: form.bonus_date, is_taxable: form.is_taxable,
    };
    if (editing) {
      await supabase.from("hr_bonuses").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("hr_bonuses").insert(payload);
    }
    setSaving(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hr_bonuses").delete().eq("id", id);
    loadData();
  };

  const getEmployeeName = (id: string) => {
    const e = employees.find(emp => emp.id === id);
    return e ? `${e.first_name} ${e.last_name}` : "Unknown";
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      paid: "bg-purple-50 text-purple-700 border-purple-200",
    };
    return `text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status] || styles.pending}`;
  };

  const totalByType = BONUS_TYPES.map(t => ({
    ...t,
    total: bonuses.filter(b => b.bonus_type === t.value).reduce((s, b) => s + b.amount, 0),
    count: bonuses.filter(b => b.bonus_type === t.value).length,
  })).filter(t => t.count > 0);

  return (
    <BusinessLayout title="Bonuses" description="Manage employee bonuses, incentives, and commissions">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Bonus
          </button>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4">{editing ? "Edit Bonus" : "New Bonus"}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Bonus Type *</label>
                  <select value={form.bonus_type} onChange={e => setForm(p => ({ ...p, bonus_type: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {BONUS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Amount *</label>
                  <input type="number" step="0.01" min={0} value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
                  <input type="date" value={form.bonus_date} onChange={e => setForm(p => ({ ...p, bonus_date: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.is_taxable} onChange={e => setForm(p => ({ ...p, is_taxable: e.target.checked }))} className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium">Taxable</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSave} disabled={saving || !form.employee_id || !form.amount} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Update" : "Create"}
                </button>
                <button onClick={resetForm} className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <p className="text-xs text-muted-foreground mb-1">Total Bonuses</p>
              <p className="text-xl font-bold">₱{bonuses.reduce((s, b) => s + b.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{bonuses.length} entries</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-xl font-bold text-amber-600">{bonuses.filter(b => b.status === "pending").length}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <p className="text-xs text-muted-foreground mb-1">Approved</p>
              <p className="text-xl font-bold text-emerald-600">{bonuses.filter(b => b.status === "approved").length}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <p className="text-xs text-muted-foreground mb-1">Paid</p>
              <p className="text-xl font-bold text-purple-600">{bonuses.filter(b => b.status === "paid").length}</p>
            </div>
          </div>

          {/* Breakdown by Type */}
          {totalByType.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Gift className="w-4 h-4 text-indigo-500" />
                Breakdown by Type
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {totalByType.map(t => (
                  <div key={t.value} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.count} entries</p>
                    </div>
                    <p className="text-sm font-bold">₱{t.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonuses Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses.map(b => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{getEmployeeName(b.employee_id)}</td>
                      <td className="px-4 py-3 capitalize">{b.bonus_type.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-right font-semibold">₱{b.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-4 py-3 text-muted-foreground">{b.bonus_date}</td>
                      <td className="px-4 py-3"><span className={statusBadge(b.status)}>{b.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bonuses.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No bonuses recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </BusinessLayout>
  );
}
