import { useState } from "react";
import { Plus, Trash2, X, Loader2, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Employee, Attendance, PayrollPeriod } from "@/pages/BusinessPayroll";

interface Props {
  employees: Employee[];
  attendance: Attendance[];
  payrollPeriods: PayrollPeriod[];
  onRefresh: () => Promise<void>;
  getEmployee: (id: string) => Employee | undefined;
}

export default function AttendanceLogger({ employees, attendance, payrollPeriods, onRefresh, getEmployee }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [form, setForm] = useState({ employee_id: "", date: "", time_in: "08:00", time_out: "17:00", status: "present" as string, notes: "" });

  const selectedPeriod = payrollPeriods.find(p => p.id === selectedPeriodId);

  // Filter attendance to only show records within the selected period's date range
  const filteredAttendance = selectedPeriod
    ? attendance.filter(a => a.date >= selectedPeriod.start_date && a.date <= selectedPeriod.end_date)
    : attendance;

  const save = async () => {
    if (!form.employee_id || !form.date) return;
    setSaving(true);
    const { error } = await supabase.from("hr_attendance_logs").upsert({
      employee_id: form.employee_id, date: form.date,
      time_in: form.status === "absent" ? null : form.time_in,
      time_out: form.status === "absent" ? null : form.time_out,
      status: form.status, notes: form.notes || null,
    }, { onConflict: "employee_id,date" });
    if (error) { alert(`Failed: ${error.message}`); setSaving(false); return; }
    setSaving(false);
    setShowForm(false);
    setForm({ employee_id: "", date: "", time_in: "08:00", time_out: "17:00", status: "present", notes: "" });
    await onRefresh();
  };

  const deleteAtt = async (id: string) => {
    await supabase.from("hr_attendance_logs").delete().eq("id", id);
    await onRefresh();
  };

  const fmtTime = (t: string | null) => t?.substring(0, 5) || "--:--";
  const statusColors: Record<string, string> = {
    present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    leave: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    half_day: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <select value={selectedPeriodId} onChange={e => setSelectedPeriodId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]">
            <option value="">All attendance</option>
            {payrollPeriods.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.start_date} to {p.end_date})</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Log Attendance
        </button>
      </div>

      {selectedPeriod && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-2">
          Showing attendance for <span className="font-medium text-foreground">{selectedPeriod.name}</span> &mdash; {selectedPeriod.start_date} to {selectedPeriod.end_date}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Log Attendance</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employee *</label>
                <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select employee...</option>
                  {employees.filter(e => e.is_active).map(e => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">On Leave</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>
              {form.status !== "absent" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Time In</label>
                    <input type="time" value={form.time_in} onChange={e => setForm({ ...form, time_in: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Time Out</label>
                    <input type="time" value={form.time_out} onChange={e => setForm({ ...form, time_out: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={save} disabled={saving}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time In</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time Out</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">
                  {selectedPeriod ? "No attendance records for this period. Log some attendance first!" : "No attendance records yet."}
                </td></tr>
              ) : filteredAttendance.map(a => {
                const emp = getEmployee(a.employee_id);
                return (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{emp ? `${emp.first_name} ${emp.last_name}` : "Unknown"}</td>
                    <td className="py-3 px-4">{a.date}</td>
                    <td className="py-3 px-4">{fmtTime(a.time_in)}</td>
                    <td className="py-3 px-4">{fmtTime(a.time_out)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status] || ""}`}>{a.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => deleteAtt(a.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
