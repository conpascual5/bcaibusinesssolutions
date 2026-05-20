import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, TrendingUp, Star, Target, MessageSquare } from "lucide-react";

type Performance = { id: string; employee_id: string; review_period: string; review_date: string; rating: number | null; score: number | null; reviewer_id: string | null; strengths: string | null; areas_for_improvement: string | null; goals: string | null; comments: string | null; status: string; };
type Employee = { id: string; first_name: string; last_name: string; };

const REVIEW_PERIODS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi-annual", label: "Semi-Annual" },
  { value: "annual", label: "Annual" },
];

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
  const [form, setForm] = useState({
    employee_id: "", review_period: "quarterly", review_date: new Date().toISOString().split("T")[0],
    rating: "", score: "", reviewer_id: "", strengths: "", areas_for_improvement: "", goals: "", comments: "",
  });

  const load = async () => {
    if (!businessOwnerId) return;
    const [pRes, eRes] = await Promise.all([
      supabase.from("hr_performances").select("*").order("review_date", { ascending: false }),
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

  const resetForm = () => {
    setForm({ employee_id: "", review_period: "quarterly", review_date: new Date().toISOString().split("T")[0], rating: "", score: "", reviewer_id: "", strengths: "", areas_for_improvement: "", goals: "", comments: "" });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (p: Performance) => {
    setForm({
      employee_id: p.employee_id, review_period: p.review_period, review_date: p.review_date,
      rating: p.rating?.toString() || "", score: p.score?.toString() || "",
      reviewer_id: p.reviewer_id || "", strengths: p.strengths || "",
      areas_for_improvement: p.areas_for_improvement || "", goals: p.goals || "", comments: p.comments || "",
    });
    setEditing(p);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.employee_id || !businessOwnerId) return;
    setSaving(true);
    const payload = {
      business_id: businessOwnerId, employee_id: form.employee_id, review_period: form.review_period,
      review_date: form.review_date, rating: form.rating ? parseInt(form.rating) : null,
      score: form.score ? parseFloat(form.score) : null, reviewer_id: form.reviewer_id || null,
      strengths: form.strengths || null, areas_for_improvement: form.areas_for_improvement || null,
      goals: form.goals || null, comments: form.comments || null,
    };
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

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 border-gray-200",
      submitted: "bg-blue-50 text-blue-700 border-blue-200",
      acknowledged: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    return `text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status] || styles.draft}`;
  };

  const getRatingColor = (rating: number | null) => {
    if (!rating) return "text-muted-foreground";
    if (rating >= 8) return "text-emerald-600";
    if (rating >= 5) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <HRLayout title="Performances" description="Employee performance reviews, ratings, and goals">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
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
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Review Period</label>
                  <select value={form.review_period} onChange={e => setForm({ ...form, review_period: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    {REVIEW_PERIODS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Review Date</label><input type="date" value={form.review_date} onChange={e => setForm({ ...form, review_date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Reviewer</label>
                  <select value={form.reviewer_id} onChange={e => setForm({ ...form, reviewer_id: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select reviewer...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Rating (1-10)</label><input type="number" min={1} max={10} value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Score (%)</label><input type="number" step="0.01" min={0} max={100} value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">Strengths</label><textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">Areas for Improvement</label><textarea value={form.areas_for_improvement} onChange={e => setForm({ ...form, areas_for_improvement: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">Goals</label><textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">Comments</label><textarea value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.employee_id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {records.map(p => (
              <div key={p.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{getEmployeeName(p.employee_id)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.review_period.replace("-", " ")}</p>
                    </div>
                  </div>
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  {p.rating && (
                    <div className="flex items-center gap-1">
                      <Star className={`w-4 h-4 ${getRatingColor(p.rating)}`} />
                      <span className={`text-lg font-bold ${getRatingColor(p.rating)}`}>{p.rating}/10</span>
                    </div>
                  )}
                  {p.score !== null && <span className="text-sm text-muted-foreground">{p.score}%</span>}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {p.strengths && <p className="truncate"><span className="font-medium">Strengths:</span> {p.strengths}</p>}
                  {p.goals && <p className="truncate"><Target className="w-3 h-3 inline mr-1" />{p.goals}</p>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={statusBadge(p.status)}>{p.status}</span>
                  <span className="text-[10px] text-muted-foreground">{p.review_date}</span>
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No performance reviews yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </HRLayout>
  );
}
