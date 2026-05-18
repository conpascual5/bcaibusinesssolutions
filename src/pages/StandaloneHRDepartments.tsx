import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Layers, Users } from "lucide-react";

type Department = { id: string; name: string; code: string | null; description: string | null; head_name: string | null; };

export default function StandaloneHRDepartments() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "", head_name: "" });

  const load = async () => {
    if (!businessOwnerId) return;
    const { data: deps } = await supabase.from("hr_departments").select("*").eq("business_id", businessOwnerId).order("name");
    if (deps) setDepartments(deps);
    const { data: emps } = await supabase.from("hr_employees").select("department").eq("business_id", businessOwnerId);
    if (emps) {
      const counts: Record<string, number> = {};
      emps.forEach(e => { if (e.department) counts[e.department] = (counts[e.department] || 0) + 1; });
      setEmployeeCounts(counts);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [businessOwnerId]);

  const resetForm = () => { setForm({ name: "", code: "", description: "", head_name: "" }); setEditing(null); setShowForm(false); };
  const openEdit = (d: Department) => { setForm({ name: d.name, code: d.code || "", description: d.description || "", head_name: d.head_name || "" }); setEditing(d); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = { ...form, business_id: businessOwnerId };
    if (editing) await supabase.from("hr_departments").update(payload).eq("id", editing.id);
    else await supabase.from("hr_departments").insert(payload);
    setSaving(false);
    resetForm();
    load();
  };

  const deleteDepartment = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    await supabase.from("hr_departments").delete().eq("id", id);
    load();
  };

  return (
    <HRLayout title="Departments" description="Organize your company structure">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{editing ? "Edit Department" : "New Department"}</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-muted-foreground">Department Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Code</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Department Head</label><input value={form.head_name} onChange={e => setForm({ ...form, head_name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
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
            {departments.map(d => (
              <div key={d.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => deleteDepartment(d.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                  </div>
                </div>
                <h4 className="font-semibold">{d.name}</h4>
                {d.code && <span className="text-xs text-muted-foreground">{d.code}</span>}
                {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
                {d.head_name && <p className="text-xs mt-2"><span className="text-muted-foreground">Head: </span>{d.head_name}</p>}
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" /> {employeeCounts[d.name] || 0} employees
                </div>
              </div>
            ))}
            {departments.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 py-12 text-center text-muted-foreground">No departments added yet.</div>
            )}
          </div>
        </div>
      )}
    </HRLayout>
  );
}
