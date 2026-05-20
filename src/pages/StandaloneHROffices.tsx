import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Building2, MapPin, Phone, Mail, Star } from "lucide-react";

type Office = { id: string; name: string; address: string | null; phone: string | null; email: string | null; is_head_office: boolean; is_active: boolean; };

export default function StandaloneHROffices() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Office | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", is_head_office: false });

  const load = async () => {
    if (!businessOwnerId) return;
    const { data } = await supabase.from("hr_offices").select("*").eq("business_id", businessOwnerId).order("name");
    if (data) setOffices(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [businessOwnerId]);

  const resetForm = () => { setForm({ name: "", address: "", phone: "", email: "", is_head_office: false }); setEditing(null); setShowForm(false); };
  const openEdit = (o: Office) => { setForm({ name: o.name, address: o.address || "", phone: o.phone || "", email: o.email || "", is_head_office: o.is_head_office }); setEditing(o); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = { business_id: businessOwnerId, name: form.name, address: form.address || null, phone: form.phone || null, email: form.email || null, is_head_office: form.is_head_office };
    if (editing) await supabase.from("hr_offices").update(payload).eq("id", editing.id);
    else await supabase.from("hr_offices").insert(payload);
    setSaving(false);
    resetForm();
    load();
  };

  const deleteOffice = async (id: string) => {
    if (!confirm("Delete this office?")) return;
    await supabase.from("hr_offices").delete().eq("id", id);
    load();
  };

  return (
    <HRLayout title="Offices" description="Manage company offices and branches">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">
              <Plus className="w-4 h-4" /> Add Office
            </button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{editing ? "Edit Office" : "New Office"}</h3>
                <button onClick={resetForm} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-xs font-medium text-muted-foreground">Office Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="head_office" checked={form.is_head_office} onChange={e => setForm({ ...form, is_head_office: e.target.checked })} className="rounded border-border" /><label htmlFor="head_office" className="text-sm">Head Office</label></div>
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
            {offices.map(o => (
              <div key={o.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(o)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => deleteOffice(o.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                  </div>
                </div>
                <h4 className="font-semibold mb-1">{o.name}</h4>
                {o.is_head_office && <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 mb-2">Head Office</span>}
                {o.address && <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1"><MapPin className="w-3 h-3 mt-0.5 shrink-0" />{o.address}</p>}
                {o.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Phone className="w-3 h-3 shrink-0" />{o.phone}</p>}
                {o.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Mail className="w-3 h-3 shrink-0" />{o.email}</p>}
              </div>
            ))}
            {offices.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 py-12 text-center text-muted-foreground">No offices added yet.</div>
            )}
          </div>
        </div>
      )}
    </HRLayout>
  );
}
