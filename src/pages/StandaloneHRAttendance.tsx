import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Clock, CalendarDays, Search } from "lucide-react";

type Attendance = { id: string; employee_id: string; date: string; time_in: string | null; time_out: string | null; status: string | null; notes: string | null; };
type Employee = { id: string; first_name: string; last_name: string; };

export default function StandaloneHRAttendance() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [records, setRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Attendance | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ employee_id: "", date: "", time_in: "", time_out: "", status: "present", notes: "" });

  const load = async () => {
    if (!businessOwnerId) return;
    const [attRes, empRes] = await Promise.all([
      supabase.from("hr_attendance").select("*").eq("business_id", businessOwnerId).order("date", { ascending: false }),
      supabase.from("hr_employees").select("id, first_name, last_name").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
    ]);
    if (attRes.data) setRecords(attRes.data);
    if (empRes.data) setEmployees(empRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [businessOwnerId]);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const resetForm = () => { setForm({ employee_id: "", date: "", time_in: "", time_out: "", status: "present", notes: "" }); setEditing(null); setShowForm(false); };
  const openEdit = (a: Attendance) => { setForm({ employee_id: a.employee_id, date: a.date, time_in: a.time_in || "", time_out: a.time_out || "", status: a.status || "present", notes: a.notes || "" }); setEditing(a); setShowForm(true); };

  const handleSave = async () => {
    if (!form.employee_id || !form.date) return;
    setSaving(true);
    const payload = { ...form, business_id: businessOwnerId };
    if (editing) await supabase.from("hr_attendance").update(payload).eq("id", editing.id);
    else await supabase.from("hr_attendance").insert(payload);
    setSaving(false);
    resetForm();
    load();
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this attendance record?")) return;
    await supabase.from("hr_attendance").delete().eq("id", id);
    load();
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !q || getEmployeeName(r.employee_id).toLowerCase().includes(q);
  });

  const statusColors: Record<string, string> = {
    present: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    late: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    absent: "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400",
    half_day: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    holiday: "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
  };

  return (
    <HRLayout title="Attendance" description="Track employee attendance and time logs">
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
              <Plus className="w-4 h-4" /> Log Attendance
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{editing ? "Edit Attendance" : "New Attendance Log"}</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><label className="text-xs font-medium text-muted-foreground">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Date *</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option><option value="half_day">Half Day</option><option value="holiday">Holiday</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Time In</label><input type="time" value={form.time_in} onChange={e => setForm({ ...form, time_in: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Time Out</label><input type="time" value={form.time_out} onChange={e => setForm({ ...form, time_out: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2 lg:col-span-3"><label className="text-xs font-medium text-muted-foreground">Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.employee_id || !form.date}
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Time In</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Time Out</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{getEmployeeName(r.employee_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.time_in || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.time_out || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[r.status || "present"] || "bg-muted text-muted-foreground"}`}>
                          {r.status || "present"}
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
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No attendance records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> {filtered.length} records
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
