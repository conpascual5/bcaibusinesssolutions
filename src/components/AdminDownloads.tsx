import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import {
  Download, Check, X, Search, Loader2, Shield, FileSpreadsheet, FileText,
  CheckCircle, XCircle, Clock, ExternalLink, ChevronRight, AlertCircle,
} from 'lucide-react';

type TrackerTemplate = {
  id: string;
  name: string;
  slug: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type UserPurchase = {
  id: string;
  user_id: string;
  template_id: string;
  format: 'excel' | 'gsheets';
  is_downloadable: boolean;
  purchased_at: string;
  downloadable_at: string | null;
  template_name?: string;
  user_email?: string;
  user_name?: string;
};

export default function AdminDownloads() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [templates, setTemplates] = useState<TrackerTemplate[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [purchasesRes, templatesRes, profilesRes] = await Promise.all([
      supabase.from('user_purchases').select('*').order('purchased_at', { ascending: false }),
      supabase.from('tracker_templates').select('id, name, slug'),
      supabase.from('profiles').select('id, email, full_name'),
    ]);

    const purchasesData = (purchasesRes.data || []) as UserPurchase[];
    const templatesData = (templatesRes.data || []) as TrackerTemplate[];
    const profilesData = (profilesRes.data || []) as ProfileRow[];

    // Enrich with names
    const enriched = purchasesData.map(p => ({
      ...p,
      template_name: templatesData.find(t => t.id === p.template_id)?.name || 'Unknown',
      user_email: profilesData.find(pr => pr.id === p.user_id)?.email || 'Unknown',
      user_name: profilesData.find(pr => pr.id === p.user_id)?.full_name || 'Unknown',
    }));

    setPurchases(enriched);
    setTemplates(templatesData);
    setProfiles(profilesData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleDownloadable = async (purchaseId: string, currentValue: boolean) => {
    setToggling(purchaseId);
    const { error } = await supabase
      .from('user_purchases')
      .update({
        is_downloadable: !currentValue,
        downloadable_at: !currentValue ? new Date().toISOString() : null,
      })
      .eq('id', purchaseId);

    if (!error) {
      setPurchases(prev =>
        prev.map(p =>
          p.id === purchaseId
            ? { ...p, is_downloadable: !currentValue, downloadable_at: !currentValue ? new Date().toISOString() : null }
            : p
        )
      );
    }
    setToggling(null);
  };

  const filtered = purchases.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.user_email?.toLowerCase().includes(q) ||
      p.user_name?.toLowerCase().includes(q) ||
      p.template_name?.toLowerCase().includes(q) ||
      p.format.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
              <Download className="w-5 h-5 text-emerald-500 stroke-[1.5]" />
              Tracker Downloads Manager
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enable or disable download access for users who purchased tracker templates.
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
          >
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by user, tracker, or format..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading purchases...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {search ? 'No purchases match your search.' : 'No purchase requests yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tracker</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchased</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">{p.user_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{p.user_email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-medium">{p.template_name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        p.format === 'gsheets'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {p.format === 'gsheets' ? (
                          <><FileSpreadsheet className="w-3 h-3" /> Google Sheets</>
                        ) : (
                          <><FileText className="w-3 h-3" /> MS Excel</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(p.purchased_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        p.is_downloadable
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.is_downloadable ? (
                          <><CheckCircle className="w-3 h-3" /> Downloadable</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Pending</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleDownloadable(p.id, p.is_downloadable)}
                        disabled={toggling === p.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          p.is_downloadable
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        } disabled:opacity-50`}
                      >
                        {toggling === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : p.is_downloadable ? (
                          <><X className="w-3.5 h-3.5" /> Revoke</>
                        ) : (
                          <><Check className="w-3.5 h-3.5" /> Enable Download</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>After enabling download, the user will see a download button in their Shop page.</span>
        </div>
      </div>
    </div>
  );
}
