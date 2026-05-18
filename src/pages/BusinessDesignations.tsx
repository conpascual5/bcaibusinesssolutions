import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Briefcase } from "lucide-react";

type Designation = {
  id: string;
  name: string;
  code: string | null;
  department_id: string | null;
  description: string | null;
  salary_grade: string | null;
  is_active: boolean;
};

type Department = { id: string; name: string };

export default function BusinessDesignations() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", department_id: "", description: "", salary_grade: "" });

  const loadData = async () => {
    if (!businessOwnerId) return;
    const [desRes, depRes] = await Promise.all([
      supabase.from("hr_designations").select("*").eq("business_id", businessOwnerId).order("name"),
      supabase.from("hr_departments").select("id, name").eq("business_id", businessOwnerId).eq("is_active", true).order("name"),
    ]);
    if (desRes.data) setDesignations(desRes.data);
    if (depRes.data) setDepartments(depRes.data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

  const resetForm = () => {
    setForm({ name: "", code: "", department_id: "", description: "", salary_grade: "" });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (d: Designation) => {
    setForm({ name: d.name, code: d.code || "", department_id: d.department_id || "", description: d.description || "", salary_grade: d.salary_grade || "" });
    setEditing(d);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !businessOwnerId) return;
    setSaving(true);
    const payload = {
      business_id: businessOwnerId, name: form.name.trim(), code: form.code || null,
      department_id: form.department_id || null, description: form.description || null,
      salary_grade: form.salary_grade || null,
    };
    if (editing) {
      await supabase.from("hr_designations").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("hr_designations").insert(payload);
    }
    setSaving(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hr_designations").delete().eq("id", id);
    loadData();
  };

  const getDeptName = (id: string | null) => departments.find(d => d.id === id)?.name || "—";

  return (
    <BusinessLayout title="Designations" description="Define job titles, positions, and salary grades">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Designation
          </button>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4">{editing ? "Edit Designation" : "New Designation"}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Designation Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Senior Software Engineer" className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Code</label>
                  <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. SSE" className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Department</label>
                  <select value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Salary Grade</label>
                  <input type="text" value={form.salary_grade} onChange={e => setForm(p => ({ ...p, salary_grade: e.target.value }))} placeholder="e.g. SG-18, Grade 5" className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Update" : "Create"}
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Salary Grade</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {designations.map(d => (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.code || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getDeptName(d.department_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.salary_grade || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {designations.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No designations yet.</td></tr>
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
