import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Clock, Users } from "lucide-react";

type Shift = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  break_start: string | null;
  break_end: string | null;
  break_paid: boolean;
  description: string | null;
  is_active: boolean;
};

type Employee = { id: string; first_name: string; last_name: string };
type EmployeeShift = {
  id: string;
  employee_id: string;
  shift_id: string;
  effective_from: string;
  effective_to: string | null;
  day_of_week: number | null;
  is_active: boolean;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function BusinessShiftRoster() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeShifts, setEmployeeShifts] = useState<EmployeeShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [saving, setSaving] = useState(false);
  const [shiftForm, setShiftForm] = useState({ name: "", start_time: "08:00", end_time: "17:00", grace_period_minutes: 15, break_start: "12:00", break_end: "13:00", break_paid: false, description: "" });
  const [assignForm, setAssignForm] = useState({ employee_id: "", shift_id: "", effective_from: new Date().toISOString().split("T")[0], effective_to: "", day_of_week: "" });

  const loadData = async () => {
    if (!businessOwnerId) return;
    const [shRes, empRes, esRes] = await Promise.all([
      supabase.from("hr_shift_rosters").select("*").eq("business_id", businessOwnerId).order("name"),
      supabase.from("hr_employees").select("id, first_name, last_name").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
      supabase.from("hr_employee_shifts").select("*").eq("business_id", businessOwnerId).order("effective_from", { ascending: false }),
    ]);
    if (shRes.data) setShifts(shRes.data);
    if (empRes.data) setEmployees(empRes.data);
    if (esRes.data) setEmployeeShifts(esRes.data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

  const resetShiftForm = () => {
    setShiftForm({ name: "", start_time: "08:00", end_time: "17:00", grace_period_minutes: 15, break_start: "12:00", break_end: "13:00", break_paid: false, description: "" });
    setEditingShift(null);
    setShowShiftForm(false);
  };

  const openEditShift = (s: Shift) => {
    setShiftForm({ name: s.name, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5), grace_period_minutes: s.grace_period_minutes, break_start: s.break_start?.slice(0, 5) || "", break_end: s.break_end?.slice(0, 5) || "", break_paid: s.break_paid, description: s.description || "" });
    setEditingShift(s);
    setShowShiftForm(true);
  };

  const handleSaveShift = async () => {
    if (!shiftForm.name.trim() || !businessOwnerId) return;
    setSaving(true);
    const payload = {
      business_id: businessOwnerId, name: shiftForm.name.trim(), start_time: shiftForm.start_time, end_time: shiftForm.end_time,
      grace_period_minutes: shiftForm.grace_period_minutes, break_start: shiftForm.break_start || null, break_end: shiftForm.break_end || null,
      break_paid: shiftForm.break_paid, description: shiftForm.description || null,
    };
    if (editingShift) {
      await supabase.from("hr_shift_rosters").update(payload).eq("id", editingShift.id);
    } else {
      await supabase.from("hr_shift_rosters").insert(payload);
    }
    setSaving(false);
    resetShiftForm();
    loadData();
  };

  const handleDeleteShift = async (id: string) => {
    await supabase.from("hr_shift_rosters").delete().eq("id", id);
    loadData();
  };

  const handleAssign = async () => {
    if (!assignForm.employee_id || !assignForm.shift_id || !businessOwnerId) return;
    setSaving(true);
    await supabase.from("hr_employee_shifts").insert({
      business_id: businessOwnerId, employee_id: assignForm.employee_id, shift_id: assignForm.shift_id,
      effective_from: assignForm.effective_from, effective_to: assignForm.effective_to || null,
      day_of_week: assignForm.day_of_week ? parseInt(assignForm.day_of_week) : null,
    });
    setSaving(false);
    setAssignForm({ employee_id: "", shift_id: "", effective_from: new Date().toISOString().split("T")[0], effective_to: "", day_of_week: "" });
    setShowAssignForm(false);
    loadData();
  };

  const getEmployeeName = (id: string) => {
    const e = employees.find(emp => emp.id === id);
    return e ? `${e.first_name} ${e.last_name}` : "Unknown";
  };

  const getShiftName = (id: string) => shifts.find(s => s.id === id)?.name || "Unknown";

  return (
    <BusinessLayout title="Shift Roster" description="Define work shifts and assign them to employees">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-3">
            <button onClick={() => { resetShiftForm(); setShowShiftForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Shift
            </button>
            <button onClick={() => setShowAssignForm(true)} className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors flex items-center gap-2">
              <Users className="w-4 h-4" /> Assign Shift
            </button>
          </div>

          {showShiftForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4">{editingShift ? "Edit Shift" : "New Shift"}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Shift Name *</label>
                  <input type="text" value={shiftForm.name} onChange={e => setShiftForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Morning Shift" className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Start Time</label>
                  <input type="time" value={shiftForm.start_time} onChange={e => setShiftForm(p => ({ ...p, start_time: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">End Time</label>
                  <input type="time" value={shiftForm.end_time} onChange={e => setShiftForm(p => ({ ...p, end_time: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Grace Period (min)</label>
                  <input type="number" value={shiftForm.grace_period_minutes} onChange={e => setShiftForm(p => ({ ...p, grace_period_minutes: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Break Start</label>
                  <input type="time" value={shiftForm.break_start} onChange={e => setShiftForm(p => ({ ...p, break_start: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Break End</label>
                  <input type="time" value={shiftForm.break_end} onChange={e => setShiftForm(p => ({ ...p, break_end: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={shiftForm.break_paid} onChange={e => setShiftForm(p => ({ ...p, break_paid: e.target.checked }))} className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium">Break is paid</span>
                  </label>
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                  <textarea value={shiftForm.description} onChange={e => setShiftForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSaveShift} disabled={saving || !shiftForm.name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingShift ? "Update" : "Create"}
                </button>
                <button onClick={resetShiftForm} className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {showAssignForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4">Assign Shift to Employee</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Employee *</label>
                  <select value={assignForm.employee_id} onChange={e => setAssignForm(p => ({ ...p, employee_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Shift *</label>
                  <select value={assignForm.shift_id} onChange={e => setAssignForm(p => ({ ...p, shift_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select shift...</option>
                    {shifts.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0,5)}-{s.end_time.slice(0,5)})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Effective From</label>
                  <input type="date" value={assignForm.effective_from} onChange={e => setAssignForm(p => ({ ...p, effective_from: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Effective To (optional)</label>
                  <input type="date" value={assignForm.effective_to} onChange={e => setAssignForm(p => ({ ...p, effective_to: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Day of Week (optional)</label>
                  <select value={assignForm.day_of_week} onChange={e => setAssignForm(p => ({ ...p, day_of_week: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All days</option>
                    {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAssign} disabled={saving || !assignForm.employee_id || !assignForm.shift_id} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Assign
                </button>
                <button onClick={() => setShowAssignForm(false)} className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {/* Shifts List */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shifts.map(s => (
              <div key={s.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditShift(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteShift(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Grace: {s.grace_period_minutes} min</p>
                  {s.break_start && <p>Break: {s.break_start.slice(0, 5)} - {s.break_end?.slice(0, 5)} {s.break_paid ? "(paid)" : "(unpaid)"}</p>}
                  {s.description && <p className="truncate">{s.description}</p>}
                </div>
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">
                    <Users className="w-3 h-3 inline mr-1" />
                    {employeeShifts.filter(es => es.shift_id === s.id && es.is_active).length} assigned
                  </p>
                </div>
              </div>
            ))}
            {shifts.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No shifts defined yet.</p>
              </div>
            )}
          </div>

          {/* Assigned Shifts */}
          {employeeShifts.length > 0 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Current Assignments
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Shift</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Effective</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeShifts.filter(es => es.is_active).slice(0, 20).map(es => (
                      <tr key={es.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{getEmployeeName(es.employee_id)}</td>
                        <td className="px-4 py-3">{getShiftName(es.shift_id)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{es.effective_from}{es.effective_to ? ` → ${es.effective_to}` : ""}</td>
                        <td className="px-4 py-3 text-muted-foreground">{es.day_of_week !== null ? DAYS[es.day_of_week] : "All"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </BusinessLayout>
  );
}
