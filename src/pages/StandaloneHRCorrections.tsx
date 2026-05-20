import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, FileEdit, Search, CheckCircle2, XCircle } from "lucide-react";

type Correction = { id: string; employee_id: string; correction_type: string; original_value: string | null; corrected_value: string | null; date: string; reason: string; status: string; approved_by: string | null; approved_at: string | null; created_at: string; };
type Employee = { id: string; first_name: string; last_name: string; };

const CORRECTION_TYPES = [
  { value: "attendance", label: "Attendance" },
  { value: "time_in", label: "Time In" },
  { value: "time_out", label: "Time Out" },
  { value: "overtime", label: "Overtime" },
  { value: "undertime", label: "Undertime" },
  { value: "other", label: "Other" },
];

export default function StandaloneHRCorrections() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [records, setRecords] = useState<Correction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ employee_id: "", correction_type: "attendance", original_value: "", corrected_value: "", date: new Date().toISOString().split("T")[0], reason: "" });

  const load = async () => {
    if (!businessOwnerId) return;
    const [cRes, eRes] = await Promise.all([
      supabase.from("hr_corrections").select("*").eq("business_id", businessOwnerId).order("created_at", { ascending: false }),
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

  const resetForm = () => { setForm({ employee_id: "", correction_type: "attendance", original_value: "", corrected_value: "", date: new Date().toISOString().split("T")[0], reason: "" }); setShowForm(false); };

  const handleSave = async () => {
    if (!form.employee_id || !form.reason.trim() || !businessOwnerId) return;
    setSaving(true);
    await supabase.from("hr_corrections").insert({
      business_id: businessOwnerId, employee_id: form.employee_id,
      correction_type: form.correction_type, original_value: form.original_value || null,
      corrected_value: form.corrected_value || null, date: form.date, reason: form.reason.trim(),
    });
    setSaving(false);
    resetForm();
    load();
  };

  const handleApprove = async (id: string) => {
    await supabase.from("hr_corrections").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const handleReject = async (id: string) => {
    await supabase.from("hr_corrections").update({ status: "rejected", approved_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !q || getEmployeeName(r.employee_id).toLowerCase().includes(q) || r.correction_type.toLowerCase().includes(q);
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return `text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status] || styles.pending}`;
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
                <h3 className="font-bold">New Correction Request</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-muted-foreground">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Correction Type *</label>
                  <select value={form.correction_type} onChange={e => setForm({ ...form, correction_type: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    {CORRECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Date *</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Original Value</label><input value={form.original_value} onChange={e => setForm({ ...form, original_value: e.target.value })} placeholder="e.g. 08:00" className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Corrected Value</label><input value={form.corrected_value} onChange={e => setForm({ ...form, corrected_value: e.target.value })} placeholder="e.g. 07:45" className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">Reason *</label><textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Explain why this correction is needed..." /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.employee_id || !form.reason.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Submit Request
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Original → Corrected</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{getEmployeeName(c.employee_id)}</td>
                      <td className="px-4 py-3 capitalize">{c.correction_type.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                      <td className="px-4 py-3 text-xs hidden sm:table-cell">
                        <span className="text-muted-foreground line-through">{c.original_value || "—"}</span>
                        <span className="mx-1.5 text-muted-foreground">→</span>
                        <span className="font-medium text-indigo-600">{c.corrected_value || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-center"><span className={statusBadge(c.status)}>{c.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === "pending" && (
                            <>
                              <button onClick={() => handleApprove(c.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600"><CheckCircle2 className="w-4 h-4" /></button>
                              <button onClick={() => handleReject(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-muted-foreground hover:text-rose-600"><XCircle className="w-4 h-4" /></button>
                            </>
                          )}
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
