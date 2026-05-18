import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, TrendingUp, Search, Star } from "lucide-react";

type Performance = { id: string; employee_id: string; review_date: string; rating: number; reviewer: string | null; notes: string | null; };
type Employee = { id: string; first_name: string; last_name: string; };

export default function StandaloneHRPerformances() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [records, setRecords] = useState<Performance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Performance | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ employee_id: "", review_date: "", rating: 3, reviewer: "", notes: "" });

  const load = async () => {
    if (!businessOwnerId) return;
    const [pRes, eRes] = await Promise.all([
      supabase.from("hr_performances").select("*").eq("business_id", businessOwnerId).order("review_date", { ascending: false }),
      supabase.from("hr_employees").select("id, first_name, last_name").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
    ]);
    if (pRes.data) setRecords(pRes.data);
    if (eRes.data) setEmployees(eRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [businessOwnerId]);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const resetForm = () => { setForm({ employee_id: "", review_date: "", rating: 3, reviewer: "", notes: "" }); setEditing(null); setShowForm(false); };
  const openEdit = (p: Performance) => { setForm({ employee_id: p.employee_id, review_date: p.review_date, rating: p.rating, reviewer: p.reviewer || "", notes: p.notes || "" }); setEditing(p); setShowForm(true); };

  const handleSave = async () => {
    if (!form.employee_id || !form.review_date) return;
    setSaving(true);
    const payload = { ...form, business_id: businessOwnerId };
    if (editing) await supabase.from("hr_performances").update(payload).eq("id", editing.id);
    else await supabase.from("hr_performances").insert(payload);
    setSaving(false);
    resetForm();
    load();
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this performance review?")) return;
    await supabase.from("hr_performances").delete().eq("id", id);
    load();
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !q || getEmployeeName(r.employee_id).toLowerCase().includes(q);
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
    ));
  };

  return (
    <HRLayout title="Performances" description="Employee performance reviews and ratings">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search by employee..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">
              <Plus className="w-4 h-4" /> New Review
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{editing ? "Edit Review" : "New Performance Review"}</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-muted-foreground">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Review Date *</label><input type="date" value={form.review_date} onChange={e => setForm({ ...form, review_date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Rating (1-5)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="range" min={1} max={5} step={1} value={form.rating} onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })} className="flex-1" />
                    <span className="text-sm font-bold w-6 text-center">{form.rating}</span>
                    <div className="flex">{renderStars(form.rating)}</div>
                  </div>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Reviewer</label><input value={form.reviewer} onChange={e => setForm({ ...form, reviewer: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.employee_id || !form.review_date}
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Rating</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Reviewer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Notes</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{getEmployeeName(p.employee_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.review_date}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">{renderStars(p.rating)}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.reviewer || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell max-w-[200px] truncate">{p.notes || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button onClick={() => deleteRecord(p.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No performance reviews found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> {filtered.length} reviews
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
