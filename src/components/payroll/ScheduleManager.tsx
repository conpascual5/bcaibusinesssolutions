import { useState } from "react";
import { Plus, Trash2, X, CheckCircle2, Loader2, Link2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DAY_NAMES } from "@/pages/BusinessPayroll";
import type { Employee, Schedule } from "@/pages/BusinessPayroll";

interface Props {
  employees: Employee[];
  schedules: Schedule[];
  onRefresh: () => Promise<void>;
  getEmployee: (id: string) => Employee | undefined;
}

export default function ScheduleManager({ employees, schedules, onRefresh, getEmployee }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employee_id: "", day_of_week: 1, start_time: "08:00", end_time: "17:00", is_rest_day: false });

  const save = async () => {
    if (!form.employee_id) return;
    setSaving(true);
    const { error } = await supabase.from("hr_employee_schedules").insert({
      employee_id: form.employee_id,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      is_rest_day: form.is_rest_day,
    });
    if (error) { alert(`Failed: ${error.message}`); setSaving(false); return; }
    setSaving(false);
    setShowForm(false);
    setForm({ employee_id: "", day_of_week: 1, start_time: "08:00", end_time: "17:00", is_rest_day: false });
    await onRefresh();
  };

  const deleteSched = async (id: string) => {
    await supabase.from("hr_employee_schedules").delete().eq("id", id);
    await onRefresh();
  };

  const fmtTime = (t: string | null) => t?.substring(0, 5) || "--:--";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Schedules synced from <span className="font-medium text-foreground">Shift Roster</span> are managed there.
          Manual schedules can be added and removed here.
        </p>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Add Schedule
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Add Work Schedule</h3>
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
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Day of Week</label>
                <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {DAY_NAMES.map((name, i) => (<option key={i} value={i}>{name}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_rest_day} onChange={e => setForm({ ...form, is_rest_day: e.target.checked })} className="rounded border-border" />
                <span className="text-sm">Rest day</span>
              </label>
              <button onClick={save} disabled={saving}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Schedule"}
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
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Day</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Grace</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Break</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Rest Day</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Source</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No schedules yet.</td></tr>
              ) : schedules.map(s => {
                const emp = getEmployee(s.employee_id);
                const isFromShift = !!s.shift_id;
                return (
                  <tr key={s.id} className={`border-b border-border/50 hover:bg-muted/30 ${isFromShift ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""}`}>
                    <td className="py-3 px-4 font-medium">{emp ? `${emp.first_name} ${emp.last_name}` : "Unknown"}</td>
                    <td className="py-3 px-4">{DAY_NAMES[s.day_of_week]}</td>
                    <td className="py-3 px-4">{s.is_rest_day ? "—" : `${fmtTime(s.start_time)} - ${fmtTime(s.end_time)}`}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{s.grace_period_minutes != null ? `${s.grace_period_minutes}m` : "—"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {s.break_start ? `${fmtTime(s.break_start)}-${fmtTime(s.break_end)}${s.break_paid ? " (paid)" : ""}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">{s.is_rest_day ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      {isFromShift ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          <Link2 className="w-3 h-3" /> Shift
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Manual</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isFromShift ? (
                        <span className="text-xs text-muted-foreground italic">Managed in Shift Roster</span>
                      ) : (
                        <button onClick={() => deleteSched(s.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
