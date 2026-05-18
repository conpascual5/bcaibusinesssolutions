import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Building2, Users, User } from "lucide-react";

type Department = {
  id: string;
  name: string;
  code: string | null;
  office_id: string | null;
  head_employee_id: string | null;
  description: string | null;
  is_active: boolean;
};

type Office = { id: string; name: string };
type Employee = { id: string; first_name: string; last_name: string };

export default function BusinessDepartments() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", office_id: "", head_employee_id: "", description: "" });

  const loadData = async () => {
    if (!businessOwnerId) return;
    const [depRes, offRes, empRes] = await Promise.all([
      supabase.from("hr_departments").select("*").eq("business_id", businessOwnerId).order("name"),
      supabase.from("hr_offices").select("id, name").eq("business_id", businessOwnerId).eq("is_active", true).order("name"),
      supabase.from("hr_employees").select("id, first_name, last_name").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
    ]);
    if (depRes.data) setDepartments(depRes.data);
    if (offRes.data) setOffices(offRes.data);
    if (empRes.data) setEmployees(empRes.data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

  const resetForm = () => {
    setForm({ name: "", code: "", office_id: "", head_employee_id: "", description: "" });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (d: Department) => {
    setForm({ name: d.name, code: d.code || "", office_id: d.office_id || "", head_employee_id: d.head_employee_id || "", description: d.description || "" });
    setEditing(d);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !businessOwnerId) return;
    setSaving(true);
    const payload = {
      business_id: businessOwnerId, name: form.name.trim(), code: form.code || null,
      office_id: form.office_id || null, head_employee_id: form.head_employee_id || null,
      description: form.description || null,
    };
    if (editing) {
      await supabase.from("hr_departments").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("hr_departments").insert(payload);
    }
    setSaving(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hr_departments").delete().eq("id", id);
    loadData();
  };

  const getOfficeName = (id: string | null) => offices.find(o => o.id === id)?.name || "—";
  const getEmployeeName = (id: string | null) => {
    const e = employees.find(emp => emp.id === id);
    return e ? `${e.first_name} ${e.last_name}` : "—";
  };

  return (
    <BusinessLayout title="Departments" description="Organize your company structure by departments">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Department
          </button>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4">{editing ? "Edit Department" : "New Department"}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Department Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Code</label>
                  <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. IT, HR, FIN" className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Office</label>
                  <select value={form.office_id} onChange={e => setForm(p => ({ ...p, office_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select office...</option>
                    {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Department Head</label>
                  <select value={form.head_employee_id} onChange={e => setForm(p => ({ ...p, head_employee_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Office</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Head</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.code || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getOfficeName(d.office_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getEmployeeName(d.head_employee_id)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No departments yet.</td></tr>
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
