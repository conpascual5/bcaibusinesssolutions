import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
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

export default function BusinessEmployees() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  // Form state
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    position: "", department: "", hire_date: "", gender: "", notes: ""
  });

  const loadEmployees = async () => {
    if (!businessOwnerId) return;
    const { data } = await supabase
      .from("hr_employees")
      .select("*")
      .eq("business_id", businessOwnerId)
      .order("last_name", { ascending: true });
    if (data) setEmployees(data);
    setLoading(false);
  };

  useEffect(() => {
    if (businessOwnerId) loadEmployees();
  }, [businessOwnerId]);

  const resetForm = () => {
    setForm({ first_name: "", last_name: "", email: "", phone: "", position: "", department: "", hire_date: "", gender: "", notes: "" });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (emp: Employee) => {
    setForm({
      first_name: emp.first_name, last_name: emp.last_name,
      email: emp.email || "", phone: emp.phone || "",
      position: emp.position || "", department: emp.department || "",
      hire_date: emp.hire_date, gender: emp.gender || "", notes: emp.notes || ""
    });
    setEditing(emp);
    setShowForm(true);
  };

  const saveEmployee = async () => {
    if (!businessOwnerId || !form.first_name || !form.last_name || !form.hire_date) return;
    setSaving(true);
    const payload = {
      business_id: businessOwnerId,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || null,
      phone: form.phone || null,
      position: form.position || null,
      department: form.department || null,
      hire_date: form.hire_date,
      gender: form.gender || null,
      notes: form.notes || null,
    };

    if (editing) {
      await supabase.from("hr_employees").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("hr_employees").insert(payload);
    }
    setSaving(false);
    resetForm();
    await loadEmployees();
  };

  const toggleActive = async (emp: Employee) => {
    await supabase.from("hr_employees").update({ is_active: !emp.is_active }).eq("id", emp.id);
    await loadEmployees();
  };

  const deleteEmployee = async (id: string) => {
    await supabase.from("hr_employees").delete().eq("id", id);
    await loadEmployees();
  };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = !q || `${e.first_name} ${e.last_name} ${e.position || ""} ${e.department || ""}`.toLowerCase().includes(q);
    const matchesFilter = filterActive === null || e.is_active === filterActive;
    return matchesSearch && matchesFilter;
  });

  return (
    <BusinessLayout title="Employee Management" description="Manage employee profiles, tenure, and status">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" placeholder="Search employees..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              <button onClick={() => setFilterActive(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterActive === null ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>All</button>
              <button onClick={() => setFilterActive(true)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterActive === true ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Active</button>
              <button onClick={() => setFilterActive(false)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterActive === false ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Inactive</button>
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              <UserPlus className="w-4 h-4" /> Add Employee
            </button>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) resetForm(); }}>
            <div className="bg-card rounded-2xl border border-border w-full max-w-lg p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">{editing ? "Edit Employee" : "Add Employee"}</h3>
                <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name *</label>
                  <input type="text" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name *</label>
                  <input type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Position</label>
                  <input type="text" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department</label>
                  <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Hire Date *</label>
                  <input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Gender</label>
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={resetForm} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button onClick={saveEmployee} disabled={saving || !form.first_name || !form.last_name || !form.hire_date} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{search ? "No employees match your search." : "No employees yet. Add your first employee!"}</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Position</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Department</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tenure</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(emp => (
                    <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                            {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-muted-foreground">{emp.email || emp.phone || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{emp.position || "—"}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{emp.department || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          <Calendar className="w-3 h-3" />
                          {calculateTenure(emp.hire_date, emp.resignation_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => toggleActive(emp)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${emp.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                          {emp.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          {emp.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(emp)} className="p-2 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteEmployee(emp.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </BusinessLayout>
  );
}
