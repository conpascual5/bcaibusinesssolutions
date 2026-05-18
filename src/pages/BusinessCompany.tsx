import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import { Loader2, Building2, Save, Pencil, X, Check } from "lucide-react";

type Company = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  tin: string | null;
  sss: string | null;
  philhealth: string | null;
  pagibig: string | null;
  description: string | null;
  founded_date: string | null;
};

export default function BusinessCompany() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", phone: "", email: "", website: "",
    tin: "", sss: "", philhealth: "", pagibig: "",
    description: "", founded_date: "",
  });

  useEffect(() => {
    if (!businessOwnerId) return;
    (async () => {
      const { data } = await supabase
        .from("hr_company")
        .select("*")
        .eq("business_id", businessOwnerId)
        .maybeSingle();
      if (data) {
        setCompany(data);
        setForm({
          name: data.name, address: data.address || "", phone: data.phone || "",
          email: data.email || "", website: data.website || "",
          tin: data.tin || "", sss: data.sss || "", philhealth: data.philhealth || "",
          pagibig: data.pagibig || "", description: data.description || "",
          founded_date: data.founded_date || "",
        });
      }
      setLoading(false);
    })();
  }, [businessOwnerId]);

  const handleSave = async () => {
    if (!form.name.trim() || !businessOwnerId) return;
    setSaving(true);
    const payload = {
      business_id: businessOwnerId,
      name: form.name.trim(),
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      tin: form.tin || null,
      sss: form.sss || null,
      philhealth: form.philhealth || null,
      pagibig: form.pagibig || null,
      description: form.description || null,
      founded_date: form.founded_date || null,
    };

    if (company?.id) {
      await supabase.from("hr_company").update(payload).eq("id", company.id);
    } else {
      const { data } = await supabase.from("hr_company").insert(payload).select().single();
      if (data) setCompany(data);
    }
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <BusinessLayout title="Company Profile" description="Manage your company information and government registrations">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="max-w-3xl space-y-6">
          {/* Company Info */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold">Company Information</h2>
                  <p className="text-sm text-muted-foreground">Basic details about your company</p>
                </div>
              </div>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? "Saved" : saving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Company Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={!editing} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Website</label>
                <input type="text" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} disabled={!editing} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={!editing} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} disabled={!editing} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Address</label>
                <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} disabled={!editing} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} disabled={!editing} rows={3} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Founded Date</label>
                <input type="date" value={form.founded_date} onChange={e => setForm(p => ({ ...p, founded_date: e.target.value }))} disabled={!editing} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
              </div>
            </div>
          </div>

          {/* Government Registrations */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold mb-4">Government Registrations</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">TIN</label>
                <input type="text" value={form.tin} onChange={e => setForm(p => ({ ...p, tin: e.target.value }))} disabled={!editing} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">SSS Number</label>
                <input type="text" value={form.sss} onChange={e => setForm(p => ({ ...p, sss: e.target.value }))} disabled={!editing} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">PhilHealth Number</label>
                <input type="text" value={form.philhealth} onChange={e => setForm(p => ({ ...p, philhealth: e.target.value }))} disabled={!editing} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Pag-IBIG Number</label>
                <input type="text" value={form.pagibig} onChange={e => setForm(p => ({ ...p, pagibig: e.target.value }))} disabled={!editing} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
              </div>
            </div>
          </div>
        </div>
      )}
    </BusinessLayout>
  );
}
