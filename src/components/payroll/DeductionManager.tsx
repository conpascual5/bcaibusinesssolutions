import { useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Deduction } from "@/pages/BusinessPayroll";

interface Props {
  businessOwnerId: string | null;
  deductions: Deduction[];
  onRefresh: () => Promise<void>;
}

export default function DeductionManager({ businessOwnerId, deductions, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Deduction | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "", amount_type: "fixed" as const, amount: 0, is_mandatory: false });

  const openNew = () => { setEditing(null); setForm({ name: "", code: "", description: "", amount_type: "fixed", amount: 0, is_mandatory: false }); setShowForm(true); };
  const openEdit = (d: Deduction) => { setEditing(d); setForm({ name: d.name, code: d.code, description: d.description || "", amount_type: d.amount_type as "fixed" | "percentage", amount: Number(d.amount), is_mandatory: d.is_mandatory }); setShowForm(true); };

  const save = async () => {
    if (!form.name || !form.code) return;
    setSaving(true);
    const payload = { business_id: businessOwnerId, ...form };
    if (editing) {
      const { error } = await supabase.from("hr_deductions").update(payload).eq("id", editing.id);
      if (error) { alert(`Failed: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("hr_deductions").insert(payload);
      if (error) { alert(`Failed: ${error.message}`); setSaving(false); return; }
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    await onRefresh();
  };

  const deleteDed = async (id: string) => {
    await supabase.from("hr_deductions").delete().eq("id", id);
    await onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Deduction
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{editing ? "Edit" : "Add"} Deduction</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. SSS" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Code *</label>
                  <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. SSS" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount Type</label>
                  <select value={form.amount_type} onChange={e => setForm({ ...form, amount_type: e.target.value as "fixed" | "percentage" })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">{form.amount_type === "fixed" ? "Amount (₱)" : "Percentage (%)"}</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_mandatory} onChange={e => setForm({ ...form, is_mandatory: e.target.checked })} className="rounded border-border" />
                <span className="text-sm">Mandatory deduction</span>
              </label>
              <button onClick={save} disabled={saving}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editing ? "Update Deduction" : "Add Deduction"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Code</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Mandatory</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Active</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No deductions yet.</td></tr>
              ) : deductions.map(d => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{d.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{d.code}</td>
                  <td className="py-3 px-4 text-right">{d.amount_type === "percentage" ? `${d.amount}%` : `₱${d.amount}`}</td>
                  <td className="py-3 px-4 text-center">{d.is_mandatory ? "Yes" : "No"}</td>
                  <td className="py-3 px-4 text-center">{d.is_active ? "Yes" : "No"}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(d)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteDed(d.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors">
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
    </div>
  );
}
