import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import {
  Loader2, UserPlus, Search, Pencil, Trash2, X, Check,
  Users, Calendar, Briefcase, ToggleLeft, ToggleRight, Filter
} from "lucide-react";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  hire_date: string;
  resignation_date: string | null;
  is_active: boolean;
  gender: string | null;
  notes: string | null;
};

function calculateTenure(hireDate: string, resignationDate: string | null): string {
  const start = new Date(hireDate);
  const end = resignationDate ? new Date(resignationDate) : new Date();
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  if (days < 0) { months--; days += new Date(end.getFullYear(), end.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  return `${years}y ${months}m ${days}d`;
}

export default function StandaloneHREmployees() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    position: "", department: "", hire_date: "", gender: "", notes: "",
  });

  const loadEmployees = async () => {
    if (!businessOwnerId) return;
    const { data } = await supabase
      .from("hr_employees")
      .select("*")
      .eq("business_id", businessOwnerId)
      .order("last_name");
    if (data) setEmployees(data);
    setLoading(false);
  };

  useEffect(() => { loadEmployees(); }, [businessOwnerId]);

  const resetForm = () => {
    setForm({ first_name: "", last_name: "", email: "", phone: "", position: "", department: "", hire_date: "", gender: "", notes: "" });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (emp: Employee) => {
    setForm({
      first_name: emp.first_name, last_name: emp.last_name, email: emp.email || "",
      phone: emp.phone || "", position: emp.position || "", department: emp.department || "",
      hire_date: emp.hire_date, gender: emp.gender || "", notes: emp.notes || "",
    });
    setEditing(emp);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.hire_date) return;
    setSaving(true);
    const payload = { ...form, business_id: businessOwnerId };
    if (editing) {
      await supabase.from("hr_employees").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("hr_employees").insert(payload);
    }
    setSaving(false);
    resetForm();
    loadEmployees();
  };

  const toggleActive = async (emp: Employee) => {
    await supabase.from("hr_employees").update({ is_active: !emp.is_active }).eq("id", emp.id);
    loadEmployees();
  };

  const deleteEmployee = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    await supabase.from("hr_employees").delete().eq("id", id);
    loadEmployees();
  };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = !search || `${e.first_name} ${e.last_name} ${e.email || ""} ${e.position || ""} ${e.department || ""}`.toLowerCase().includes(q);
    const matchesActive = filterActive === null || e.is_active === filterActive;
    return matchesSearch && matchesActive;
  });

  return (
    <HRLayout title="Employees" description="Manage employee profiles and records">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text" placeholder="Search employees..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {[null, true, false].map(val => (
                <button key={String(val)} onClick={() => setFilterActive(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterActive === val ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {val === null ? "All" : val ? "Active" : "Inactive"}
                </button>
              ))}
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">
              <UserPlus className="w-4 h-4" /> Add Employee
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{editing ? "Edit Employee" : "New Employee"}</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><label className="text-xs font-medium text-muted-foreground">First Name *</label><input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Last Name *</label><input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Position</label><input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Department</label><input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Hire Date *</label><input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Gender</label><select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"><option value="">Select</option><option>Male</option><option>Female</option></select></div>
                <div className="sm:col-span-2 lg:col-span-3"><label className="text-xs font-medium text-muted-foreground">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.first_name || !form.last_name || !form.hire_date}
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Position</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Department</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tenure</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                          <div>
                            <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-muted-foreground">{emp.email || emp.phone || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span className="text-muted-foreground">{emp.position || "—"}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="text-muted-foreground">{emp.department || "—"}</span></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-muted-foreground">{calculateTenure(emp.hire_date, emp.resignation_date)}</span></td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.is_active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'}`}>
                          {emp.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {emp.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleActive(emp)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title={emp.is_active ? "Deactivate" : "Activate"}>
                            {emp.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                          </button>
                          <button onClick={() => openEdit(emp)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                          <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No employees found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> {filtered.length} of {employees.length} employees
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
