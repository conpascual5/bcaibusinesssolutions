import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import { Loader2, Plus, Pencil, X, Check, TrendingUp, Star, Target, MessageSquare } from "lucide-react";

type Performance = {
  id: string;
  employee_id: string;
  review_period: string;
  review_date: string;
  rating: number | null;
  score: number | null;
  reviewer_id: string | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  goals: string | null;
  comments: string | null;
  status: string;
};

type Employee = { id: string; first_name: string; last_name: string };

const REVIEW_PERIODS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi-annual", label: "Semi-Annual" },
  { value: "annual", label: "Annual" },
];

export default function BusinessPerformances() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Performance | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employee_id: "", review_period: "quarterly", review_date: new Date().toISOString().split("T")[0],
    rating: "", score: "", reviewer_id: "", strengths: "", areas_for_improvement: "", goals: "", comments: "",
  });

  const loadData = async () => {
    if (!businessOwnerId) return;
    const [perfRes, empRes] = await Promise.all([
      supabase.from("hr_performances").select("*").order("review_date", { ascending: false }),
      supabase.from("hr_employees").select("id, first_name, last_name").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
    ]);
    if (perfRes.data) setPerformances(perfRes.data);
    if (empRes.data) setEmployees(empRes.data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

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
    if (editing) {
      await supabase.from("hr_performances").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("hr_performances").insert(payload);
    }
    setSaving(false);
    resetForm();
    loadData();
  };

  const getEmployeeName = (id: string) => {
    const e = employees.find(emp => emp.id === id);
    return e ? `${e.first_name} ${e.last_name}` : "Unknown";
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
    <BusinessLayout title="Performance Reviews" description="Track employee performance, ratings, and goals">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Review
          </button>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4">{editing ? "Edit Review" : "New Performance Review"}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Review Period</label>
                  <select value={form.review_period} onChange={e => setForm(p => ({ ...p, review_period: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {REVIEW_PERIODS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Review Date</label>
                  <input type="date" value={form.review_date} onChange={e => setForm(p => ({ ...p, review_date: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Reviewer</label>
                  <select value={form.reviewer_id} onChange={e => setForm(p => ({ ...p, reviewer_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select reviewer...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Rating (1-10)</label>
                  <input type="number" min={1} max={10} value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Score (%)</label>
                  <input type="number" step="0.01" min={0} max={100} value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Strengths</label>
                  <textarea value={form.strengths} onChange={e => setForm(p => ({ ...p, strengths: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Areas for Improvement</label>
                  <textarea value={form.areas_for_improvement} onChange={e => setForm(p => ({ ...p, areas_for_improvement: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Goals</label>
                  <textarea value={form.goals} onChange={e => setForm(p => ({ ...p, goals: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Comments</label>
                  <textarea value={form.comments} onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSave} disabled={saving || !form.employee_id} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Update" : "Create"}
                </button>
                <button onClick={resetForm} className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {performances.map(p => (
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
                  {p.score !== null && (
                    <span className="text-sm text-muted-foreground">{p.score}%</span>
                  )}
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
            {performances.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No performance reviews yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </BusinessLayout>
  );
}
