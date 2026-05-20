import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, BadgeCheck } from "lucide-react";

type Designation = { id: string; name: string; code: string | null; department_id: string | null; description: string | null; salary_grade: string | null; is_active: boolean; };
type Department = { id: string; name: string };

export default function StandaloneHRDesignations() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", department_id: "", description: "", salary_grade: "" });

  const load = async () => {
    if (!businessOwnerId) return;
    const [desRes, depRes] = await Promise.all([
      supabase.from("hr_designations").select("*").eq("business_id", businessOwnerId).order("name"),
      supabase.from("hr_departments").select("id, name").eq("business_id", businessOwnerId).eq("is_active", true).order("name"),
    ]);
    if (desRes.data) setDesignations(desRes.data);
    if (depRes.data) setDepartments(depRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [businessOwnerId]);

  const resetForm = () => { setForm({ name: "", code: "", department_id: "", description: "", salary_grade: "" }); setEditing(null); setShowForm(false); };
  const openEdit = (d: Designation) => { setForm({ name: d.name, code: d.code || "", department_id: d.department_id || "", description: d.description || "", salary_grade: d.salary_grade || "" }); setEditing(d); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = { business_id: businessOwnerId, name: form.name, code: form.code || null, department_id: form.department_id || null, description: form.description || null, salary_grade: form.salary_grade || null };
    if (editing) await supabase.from("hr_designations").update(payload).eq("id", editing.id);
    else await supabase.from("hr_designations").insert(payload);
    setSaving(false);
    resetForm();
    load();
  };

  const deleteDesignation = async (id: string) => {
    if (!confirm("Delete this designation?")) return;
    await supabase.from("hr_designations").delete().eq("id", id);
    load();
  };

  const getDeptName = (id: string | null) => departments.find(d => d.id === id)?.name || "—";

  return (
    <HRLayout title="Designations" description="Define job titles, positions, and salary grades">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">
              <Plus className="w-4 h-4" /> Add Designation
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{editing ? "Edit Designation" : "New Designation"}</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-muted-foreground">Designation Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Senior Software Engineer" className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Code</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. SSE" className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Department</label>
                  <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Salary Grade</label><input value={form.salary_grade} onChange={e => setForm({ ...form, salary_grade: e.target.value })} placeholder="e.g. SG-18, Grade 5" className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.name}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {designations.map(d => (
              <div key={d.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/30">
                    <BadgeCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => deleteDesignation(d.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                  </div>
                </div>
                <h4 className="font-semibold">{d.name}</h4>
                {d.code && <span className="text-xs text-muted-foreground">{d.code}</span>}
                {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
                <p className="text-xs mt-1"><span className="text-muted-foreground">Department: </span>{getDeptName(d.department_id)}</p>
                {d.salary_grade && <p className="text-xs"><span className="text-muted-foreground">Grade: </span>{d.salary_grade}</p>}
              </div>
            ))}
            {designations.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 py-12 text-center text-muted-foreground">No designations added yet.</div>
            )}
          </div>
        </div>
      )}
    </HRLayout>
  );
}
