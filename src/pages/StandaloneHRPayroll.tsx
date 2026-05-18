import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Wallet, Search, Download } from "lucide-react";

type Payroll = { id: string; employee_id: string; period_start: string; period_end: string; gross_pay: number; deductions: number; net_pay: number; status: string; notes: string | null; };
type Employee = { id: string; first_name: string; last_name: string; };

export default function StandaloneHRPayroll() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [records, setRecords] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Payroll | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ employee_id: "", period_start: "", period_end: "", gross_pay: 0, deductions: 0, net_pay: 0, status: "draft", notes: "" });

  const load = async () => {
    if (!businessOwnerId) return;
    const [pRes, eRes] = await Promise.all([
      supabase.from("hr_payroll").select("*").eq("business_id", businessOwnerId).order("period_start", { ascending: false }),
      supabase.from("hr_employees").select("id, first_name, last_name").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
    ]);
    if (pRes.data) setRecords(pRes.data);
    if (eRes.data) setEmployees(eRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [businessOwnerId]);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const resetForm = () => { setForm({ employee_id: "", period_start: "", period_end: "", gross_pay: 0, deductions: 0, net_pay: 0, status: "draft", notes: "" }); setEditing(null); setShowForm(false); };
  const openEdit = (p: Payroll) => { setForm({ employee_id: p.employee_id, period_start: p.period_start, period_end: p.period_end, gross_pay: p.gross_pay, deductions: p.deductions, net_pay: p.net_pay, status: p.status, notes: p.notes || "" }); setEditing(p); setShowForm(true); };

  const handleSave = async () => {
    if (!form.employee_id || !form.period_start || !form.period_end) return;
    setSaving(true);
    const payload = { ...form, business_id: businessOwnerId };
    if (editing) await supabase.from("hr_payroll").update(payload).eq("id", editing.id);
    else await supabase.from("hr_payroll").insert(payload);
    setSaving(false);
    resetForm();
    load();
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this payroll record?")) return;
    await supabase.from("hr_payroll").delete().eq("id", id);
    load();
  };

  const formatCurrency = (val: number) => `₱${val.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !q || getEmployeeName(r.employee_id).toLowerCase().includes(q);
  });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    computed: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    approved: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    paid: "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400",
  };

  return (
    <HRLayout title="Payroll" description="Manage employee payroll and compensation">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search by employee..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">
              <Plus className="w-4 h-4" /> New Payroll
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{editing ? "Edit Payroll" : "New Payroll Entry"}</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><label className="text-xs font-medium text-muted-foreground">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="draft">Draft</option><option value="computed">Computed</option><option value="approved">Approved</option><option value="paid">Paid</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Period Start *</label><input type="date" value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Period End *</label><input type="date" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Gross Pay (₱)</label><input type="number" step="0.01" value={form.gross_pay} onChange={e => setForm({ ...form, gross_pay: parseFloat(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Deductions (₱)</label><input type="number" step="0.01" value={form.deductions} onChange={e => setForm({ ...form, deductions: parseFloat(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Net Pay (₱)</label><input type="number" step="0.01" value={form.net_pay} onChange={e => setForm({ ...form, net_pay: parseFloat(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2 lg:col-span-3"><label className="text-xs font-medium text-muted-foreground">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.employee_id || !form.period_start || !form.period_end}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Period</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Gross</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Deductions</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net Pay</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{getEmployeeName(p.employee_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.period_start} → {p.period_end}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{formatCurrency(p.gross_pay)}</td>
                      <td className="px-4 py-3 text-right text-rose-500 hidden sm:table-cell">-{formatCurrency(p.deductions)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.net_pay)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[p.status] || "bg-muted text-muted-foreground"}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button onClick={() => deleteRecord(p.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No payroll records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5" /> {filtered.length} records
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
