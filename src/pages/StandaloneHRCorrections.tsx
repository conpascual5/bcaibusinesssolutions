import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, FileEdit, Search } from "lucide-react";

type Correction = { id: string; employee_id: string; date: string; field: string; old_value: string | null; new_value: string | null; reason: string | null; status: string; };
type Employee = { id: string; first_name: string; last_name: string; };

export default function StandaloneHRCorrections() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [records, setRecords] = useState<Correction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Correction | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ employee_id: "", date: "", field: "", old_value: "", new_value: "", reason: "", status: "pending" });

  const load = async () => {
    if (!businessOwnerId) return;
    const [cRes, eRes] = await Promise.all([
      supabase.from("hr_corrections").select("*").eq("business_id", businessOwnerId).order("date", { ascending: false }),
      supabase.from("hr_employees").select("id, first_name, last_name").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
    ]);
    if (cRes.data) setRecords(cRes.data);
    if (eRes.data) setEmployees(eRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [businessOwnerId]);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const resetForm = () => { setForm({ employee_id: "", date: "", field: "", old_value: "", new_value: "", reason: "", status: "pending" }); setEditing(null); setShowForm(false); };
  const openEdit = (c: Correction) => { setForm({ employee_id: c.employee_id, date: c.date, field: c.field, old_value: c.old_value || "", new_value: c.new_value || "", reason: c.reason || "", status: c.status }); setEditing(c); setShowForm(true); };

  const handleSave = async () => {
    if (!form.employee_id || !form.date || !form.field) return;
    setSaving(true);
    const payload = { ...form, business_id: businessOwnerId };
    if (editing) await supabase.from("hr_corrections").update(payload).eq("id", editing.id);
    else await supabase.from("hr_corrections").insert(payload);
    setSaving(false);
    resetForm();
    load();
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this correction?")) return;
    await supabase.from("hr_corrections").delete().eq("id", id);
    load();
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !q || getEmployeeName(r.employee_id).toLowerCase().includes(q) || r.field.toLowerCase().includes(q);
  });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    approved: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    rejected: "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400",
  };

  return (
    <HRLayout title="Corrections" description="Manage attendance and record corrections">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">
              <Plus className="w-4 h-4" /> New Correction
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{editing ? "Edit Correction" : "New Correction"}</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-muted-foreground">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Date *</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Field *</label><input value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} placeholder="e.g. time_in, time_out" className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Old Value</label><input value={form.old_value} onChange={e => setForm({ ...form, old_value: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">New Value</label><input value={form.new_value} onChange={e => setForm({ ...form, new_value: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">Reason *</label><textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.employee_id || !form.date || !form.field}
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Field</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Old → New</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{getEmployeeName(c.employee_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                      <td className="px-4 py-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.field}</code></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{c.old_value || "—"} → {c.new_value || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[c.status] || "bg-muted text-muted-foreground"}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button onClick={() => deleteRecord(c.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No corrections found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
              <FileEdit className="w-3.5 h-3.5" /> {filtered.length} corrections
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
