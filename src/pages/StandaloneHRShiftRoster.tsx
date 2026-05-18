import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, CalendarRange, Clock } from "lucide-react";

type Shift = { id: string; name: string; start_time: string; end_time: string; grace_period: number | null; description: string | null; };

export default function StandaloneHRShiftRoster() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", start_time: "08:00", end_time: "17:00", grace_period: 15, description: "" });

  const load = async () => {
    if (!businessOwnerId) return;
    const { data } = await supabase.from("hr_shifts").select("*").eq("business_id", businessOwnerId).order("name");
    if (data) setShifts(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [businessOwnerId]);

  const resetForm = () => { setForm({ name: "", start_time: "08:00", end_time: "17:00", grace_period: 15, description: "" }); setEditing(null); setShowForm(false); };
  const openEdit = (s: Shift) => { setForm({ name: s.name, start_time: s.start_time, end_time: s.end_time, grace_period: s.grace_period || 15, description: s.description || "" }); setEditing(s); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name || !form.start_time || !form.end_time) return;
    setSaving(true);
    const payload = { ...form, business_id: businessOwnerId };
    if (editing) await supabase.from("hr_shifts").update(payload).eq("id", editing.id);
    else await supabase.from("hr_shifts").insert(payload);
    setSaving(false);
    resetForm();
    load();
  };

  const deleteShift = async (id: string) => {
    if (!confirm("Delete this shift?")) return;
    await supabase.from("hr_shifts").delete().eq("id", id);
    load();
  };

  return (
    <HRLayout title="Shift Roster" description="Define work shifts and schedules">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">
              <Plus className="w-4 h-4" /> Add Shift
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{editing ? "Edit Shift" : "New Shift"}</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-muted-foreground">Shift Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Grace Period (min)</label><input type="number" value={form.grace_period} onChange={e => setForm({ ...form, grace_period: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Start Time *</label><input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">End Time *</label><input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.name || !form.start_time || !form.end_time}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shifts.map(s => (
              <div key={s.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
                    <CalendarRange className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => deleteShift(s.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                  </div>
                </div>
                <h4 className="font-semibold">{s.name}</h4>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{s.start_time} — {s.end_time}</span>
                </div>
                {s.grace_period ? <p className="text-xs text-muted-foreground mt-1">{s.grace_period} min grace period</p> : null}
                {s.description && <p className="text-xs text-muted-foreground mt-2">{s.description}</p>}
              </div>
            ))}
            {shifts.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 py-12 text-center text-muted-foreground">No shifts defined yet.</div>
            )}
          </div>
        </div>
      )}
    </HRLayout>
  );
}
