import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Building2, MapPin, Phone, Mail, Star } from "lucide-react";

type Office = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_head_office: boolean;
  is_active: boolean;
};

export default function BusinessOffices() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Office | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", is_head_office: false });

  const loadData = async () => {
    if (!businessOwnerId) return;
    const { data } = await supabase.from("hr_offices").select("*").eq("business_id", businessOwnerId).order("name");
    if (data) setOffices(data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

  const resetForm = () => {
    setForm({ name: "", address: "", phone: "", email: "", is_head_office: false });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (o: Office) => {
    setForm({ name: o.name, address: o.address || "", phone: o.phone || "", email: o.email || "", is_head_office: o.is_head_office });
    setEditing(o);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !businessOwnerId) return;
    setSaving(true);
    const payload = { business_id: businessOwnerId, name: form.name.trim(), address: form.address || null, phone: form.phone || null, email: form.email || null, is_head_office: form.is_head_office };
    if (editing) {
      await supabase.from("hr_offices").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("hr_offices").insert(payload);
    }
    setSaving(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hr_offices").delete().eq("id", id);
    loadData();
  };

  return (
    <BusinessLayout title="Offices" description="Manage company branches and office locations">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Office
          </button>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4">{editing ? "Edit Office" : "New Office"}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Office Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Address</label>
                  <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.is_head_office} onChange={e => setForm(p => ({ ...p, is_head_office: e.target.checked }))} className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium">Set as Head Office</span>
                  </label>
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offices.map(o => (
              <div key={o.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                      <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{o.name}</p>
                      {o.is_head_office && (
                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3" /> Head Office
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(o)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(o.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {o.address && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1"><MapPin className="w-3 h-3" /> {o.address}</p>}
                {o.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1"><Phone className="w-3 h-3" /> {o.phone}</p>}
                {o.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" /> {o.email}</p>}
              </div>
            ))}
            {offices.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No offices yet. Add your first office to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </BusinessLayout>
  );
}
