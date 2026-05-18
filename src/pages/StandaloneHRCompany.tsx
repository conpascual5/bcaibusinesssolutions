import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
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

export default function StandaloneHRCompany() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
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
    if (!form.name) return;
    setSaving(true);
    const payload = { ...form, business_id: businessOwnerId };
    if (company) {
      await supabase.from("hr_company").update(payload).eq("id", company.id);
    } else {
      await supabase.from("hr_company").insert(payload);
    }
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    const { data } = await supabase.from("hr_company").select("*").eq("business_id", businessOwnerId).maybeSingle();
    if (data) setCompany(data);
  };

  return (
    <HRLayout title="Company" description="Company profile and government-mandated IDs">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30"><Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                <div><h3 className="font-bold text-lg">{company?.name || "Company Profile"}</h3><p className="text-xs text-muted-foreground">Fill in your company details</p></div>
              </div>
              {!editing && (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Company Name *</label>
                {editing ? (
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                ) : (
                  <p className="mt-1 text-sm font-medium">{company?.name || "—"}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Address</label>
                {editing ? (
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{company?.address || "—"}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                {editing ? (
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{company?.phone || "—"}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                {editing ? (
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{company?.email || "—"}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Website</label>
                {editing ? (
                  <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{company?.website || "—"}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Founded Date</label>
                {editing ? (
                  <input type="date" value={form.founded_date} onChange={e => setForm({ ...form, founded_date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{company?.founded_date || "—"}</p>
                )}
              </div>
            </div>

            {editing && (
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.name}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold mb-4">Government IDs</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "TIN", value: company?.tin, key: "tin" as const },
                { label: "SSS", value: company?.sss, key: "sss" as const },
                { label: "PhilHealth", value: company?.philhealth, key: "philhealth" as const },
                { label: "Pag-IBIG", value: company?.pagibig, key: "pagibig" as const },
              ].map(gov => (
                <div key={gov.key} className="bg-muted/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{gov.label}</p>
                  {editing ? (
                    <input value={form[gov.key]} onChange={e => setForm({ ...form, [gov.key]: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  ) : (
                    <p className="text-sm font-medium">{gov.value || "—"}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold mb-2">Description</h3>
            {editing ? (
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            ) : (
              <p className="text-sm text-muted-foreground">{company?.description || "No description provided."}</p>
            )}
          </div>
        </div>
      )}
    </HRLayout>
  );
}
