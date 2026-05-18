import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Umbrella, Search, Filter } from "lucide-react";

type LeaveType = { id: string; name: string; code: string; days_allowed: number; };
type LeaveRecord = { id: string; employee_id: string; leave_type_id: string; start_date: string; end_date: string; days_taken: number; status: string; reason: string | null; };
type Employee = { id: string; first_name: string; last_name: string; };

export default function StandaloneHRLeave() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeaveRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", days_taken: 1, status: "pending", reason: "" });

  const load = async () => {
    if (!businessOwnerId) return;
    const [lRes, ltRes, eRes] = await Promise.all([
      supabase.from("hr_leave").select("*").eq("business_id", businessOwnerId).order("start_date", { ascending: false }),
      supabase.from("hr_leave_types").select("*").eq("business_id", businessOwnerId).order("name"),
      supabase.from("hr_employees").select("id, first_name, last_name").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
    ]);
    if (lRes.data) setRecords(lRes.data);
    if (ltRes.data) setLeaveTypes(ltRes.data);
    if (eRes.data) setEmployees(eRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [businessOwnerId]);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };
  const getLeaveTypeName = (id: string) => {
    const lt = leaveTypes.find(t => t.id === id);
    return lt ? `${lt.name} (${lt.code})` : "Unknown";
  };

  const resetForm = () => { setForm({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", days_taken: 1, status: "pending", reason: "" }); setEditing(null); setShowForm(false); };
  const openEdit = (r: LeaveRecord) => { setForm({ employee_id: r.employee_id, leave_type_id: r.leave_type_id, start_date: r.start_date, end_date: r.end_date, days_taken: r.days_taken, status: r.status, reason: r.reason || "" }); setEditing(r); setShowForm(true); };

  const handleSave = async () => {
    if (!form.employee_id || !form.leave_type_id || !form.start_date || !form.end_date) return;
    setSaving(true);
    const payload = { ...form, business_id: businessOwnerId };
    if (editing) await supabase.from("hr_leave").update(payload).eq("id", editing.id);
    else await supabase.from("hr_leave").insert(payload);
    setSaving(false);
    resetForm();
    load();
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this leave record?")) return;
    await supabase.from("hr_leave").delete().eq("id", id);
    load();
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = !q || getEmployeeName(r.employee_id).toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    approved: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    rejected: "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400",
    cancelled: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  };

  return (
    <HRLayout title="Leave" description="Manage employee leave requests">
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
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {["all", "pending", "approved", "rejected"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">
              <Plus className="w-4 h-4" /> New Leave
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{editing ? "Edit Leave" : "New Leave Request"}</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><label className="text-xs font-medium text-muted-foreground">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Leave Type *</label>
                  <select value={form.leave_type_id} onChange={e => setForm({ ...form, leave_type_id: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select type</option>
                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Start Date *</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">End Date *</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Days Taken</label><input type="number" min={0.5} step={0.5} value={form.days_taken} onChange={e => setForm({ ...form, days_taken: parseFloat(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2 lg:col-span-3"><label className="text-xs font-medium text-muted-foreground">Reason</label><textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.employee_id || !form.leave_type_id || !form.start_date || !form.end_date}
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Leave Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Dates</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Days</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{getEmployeeName(r.employee_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getLeaveTypeName(r.leave_type_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.start_date} → {r.end_date}</td>
                      <td className="px-4 py-3 text-center">{r.days_taken}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[r.status] || "bg-muted text-muted-foreground"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button onClick={() => deleteRecord(r.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No leave records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
              <Umbrella className="w-3.5 h-3.5" /> {filtered.length} records
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
