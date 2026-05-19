import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import { Loader2, Plus, X, Check, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

type Correction = {
  id: string;
  employee_id: string;
  correction_type: string;
  original_value: string | null;
  corrected_value: string | null;
  date: string;
  reason: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

type Employee = { id: string; first_name: string; last_name: string };

const CORRECTION_TYPES = [
  { value: "attendance", label: "Attendance" },
  { value: "time_in", label: "Time In" },
  { value: "time_out", label: "Time Out" },
  { value: "overtime", label: "Overtime" },
  { value: "undertime", label: "Undertime" },
  { value: "other", label: "Other" },
];

export default function BusinessCorrections() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employee_id: "", correction_type: "attendance", original_value: "", corrected_value: "", date: new Date().toISOString().split("T")[0], reason: "" });

  const loadData = async () => {
    if (!businessOwnerId) return;
    const [corRes, empRes] = await Promise.all([
      supabase.from("hr_corrections").select("*").eq("business_id", businessOwnerId).order("created_at", { ascending: false }),
      supabase.from("hr_employees").select("id, first_name, last_name").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
    ]);
    if (corRes.data) setCorrections(corRes.data);
    if (empRes.data) setEmployees(empRes.data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

  const resetForm = () => {
    setForm({ employee_id: "", correction_type: "attendance", original_value: "", corrected_value: "", date: new Date().toISOString().split("T")[0], reason: "" });
    setShowForm(false);
  };

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
    loadData();
  };

  const handleApprove = async (id: string) => {
    await supabase.from("hr_corrections").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", id);
    loadData();
  };

  const handleReject = async (id: string) => {
    await supabase.from("hr_corrections").update({ status: "rejected", approved_at: new Date().toISOString() }).eq("id", id);
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
      rejected: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return `text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status] || styles.pending}`;
  };

  return (
    <BusinessLayout title="Attendance Corrections" description="Manage time log corrections and adjustments">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Correction Request
          </button>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4">New Correction Request</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Correction Type *</label>
                  <select value={form.correction_type} onChange={e => setForm(p => ({ ...p, correction_type: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {CORRECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Original Value</label>
                  <input type="text" value={form.original_value} onChange={e => setForm(p => ({ ...p, original_value: e.target.value }))} placeholder="e.g. 08:00" className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Corrected Value</label>
                  <input type="text" value={form.corrected_value} onChange={e => setForm(p => ({ ...p, corrected_value: e.target.value }))} placeholder="e.g. 07:45" className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Reason *</label>
                  <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Explain why this correction is needed..." />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSave} disabled={saving || !form.employee_id || !form.reason.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Submit Request
                </button>
                <button onClick={resetForm} className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Original → Corrected</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.map(c => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{getEmployeeName(c.employee_id)}</td>
                      <td className="px-4 py-3 capitalize">{c.correction_type.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground line-through">{c.original_value || "—"}</span>
                        <span className="mx-1.5 text-muted-foreground">→</span>
                        <span className="font-medium text-indigo-600">{c.corrected_value || "—"}</span>
                      </td>
                      <td className="px-4 py-3"><span className={statusBadge(c.status)}>{c.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        {c.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleApprove(c.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600"><CheckCircle2 className="w-4 h-4" /></button>
                            <button onClick={() => handleReject(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-muted-foreground hover:text-rose-600"><XCircle className="w-4 h-4" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {corrections.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No correction requests yet.</td></tr>
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
