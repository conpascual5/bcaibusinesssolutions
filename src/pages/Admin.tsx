import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import {
  Users, Settings, Shield, CheckCircle, XCircle,
  Star, Crown, Sparkles, X, Clock, History, Key, Eye, EyeOff, Check, AlertCircle,
} from 'lucide-react';

function ApiKeySettings() {
  const [deepseekKey, setDeepseekKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [deepseekSaved, setDeepseekSaved] = useState(false);
  const [openaiSaved, setOpenaiSaved] = useState(false);

  const { data: existingDeepseek, refetch: refetchDeepseek } = trpc.settings.getDeepseekKey.useQuery();
  const { data: existingOpenai, refetch: refetchOpenai } = trpc.settings.getOpenaiKey.useQuery();
  const setDeepseekMutation = trpc.settings.setDeepseekKey.useMutation({
    onSuccess: () => { setDeepseekSaved(true); setTimeout(() => setDeepseekSaved(false), 2000); refetchDeepseek(); },
  });
  const setOpenaiMutation = trpc.settings.setOpenaiKey.useMutation({
    onSuccess: () => { setOpenaiSaved(true); setTimeout(() => setOpenaiSaved(false), 2000); refetchOpenai(); },
  });

  useEffect(() => {
    if (existingDeepseek?.apiKey) setDeepseekKey(existingDeepseek.apiKey);
  }, [existingDeepseek]);

  useEffect(() => {
    if (existingOpenai?.apiKey) setOpenaiKey(existingOpenai.apiKey);
  }, [existingOpenai]);

  const handleSaveDeepseek = () => {
    if (deepseekKey.trim()) setDeepseekMutation.mutate({ apiKey: deepseekKey.trim() });
  };

  const handleSaveOpenai = () => {
    if (openaiKey.trim()) setOpenaiMutation.mutate({ apiKey: openaiKey.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5 mb-1">
          <Key className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
          API Keys
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure AI provider API keys. The chat will use <strong>Deepseek</strong> as the primary provider and fall back to <strong>OpenAI</strong> if Deepseek is unavailable.
        </p>

        {/* Deepseek */}
        <div className="mb-6 p-4 rounded-xl border border-border bg-accent/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Deepseek API Key</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Primary</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showDeepseek ? 'text' : 'password'}
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowDeepseek(!showDeepseek)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showDeepseek ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveDeepseek}
              disabled={!deepseekKey.trim() || setDeepseekMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {setDeepseekMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : deepseekSaved ? (
                <Check className="w-4 h-4" />
              ) : null}
              {deepseekSaved ? 'Saved' : 'Save'}
            </button>
          </div>
          {existingDeepseek?.apiKey && (
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Key is configured
            </p>
          )}
        </div>

        {/* OpenAI */}
        <div className="p-4 rounded-xl border border-border bg-accent/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">OpenAI API Key</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Fallback</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showOpenai ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowOpenai(!showOpenai)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveOpenai}
              disabled={!openaiKey.trim() || setOpenaiMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {setOpenaiMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : openaiSaved ? (
                <Check className="w-4 h-4" />
              ) : null}
              {openaiSaved ? 'Saved' : 'Save'}
            </button>
          </div>
          {existingOpenai?.apiKey && (
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Key is configured
            </p>
          )}
        </div>

        {/* Info notice */}
        <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            At least one API key is required for the chat to work. Deepseek is tried first; if it fails, OpenAI is used as fallback. Keys are stored securely in the database.
          </p>
        </div>
      </div>
    </div>
  );
}

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free', icon: Sparkles },
  { value: 'pro', label: 'Pro', icon: Crown },
  { value: 'vip', label: 'VIP', icon: Star },
] as const;

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<'users' | 'settings'>('users');
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);

  const { data: usersList, refetch: refetchUsers, isFetching: usersFetching, error: usersError } = trpc.user.list.useQuery();
  const { data: planHistoryData, refetch: refetchPlanHistory } = trpc.user.planHistory.useQuery(
    { userId: historyUserId ?? '' },
    { enabled: !!historyUserId },
  );

  const toggleActiveMutation = trpc.user.toggleActive.useMutation({ onSuccess: () => refetchUsers() });
  const setPlanMutation = trpc.user.setPlan.useMutation({ onSuccess: () => refetchUsers() });

  useEffect(() => {
    if (historyUserId) refetchPlanHistory();
  }, [historyUserId, refetchPlanHistory]);

  const totalUsers = usersList?.length ?? 0;

  const planBadge = useMemo(() => {
    return (plan: string) => {
      if (plan === 'vip') return 'bg-purple-50 text-purple-700 border-purple-200';
      if (plan === 'pro') return 'bg-amber-50 text-amber-700 border-amber-200';
      return 'bg-slate-100 text-slate-700 border-slate-200';
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Admin access required.</p>
          <button onClick={() => navigate('/app')} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm font-semibold">
            Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage users and plans.</p>
        </div>

        <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-border w-fit mb-8">
          <button
            onClick={() => setActiveSection('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'users'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Users className="w-4 h-4 stroke-[1.5]" />
            Users
          </button>
          <button
            onClick={() => setActiveSection('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'settings'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Settings className="w-4 h-4 stroke-[1.5]" />
            Settings
          </button>
        </div>

        {activeSection === 'users' && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
                <Users className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
                Registered Users
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-medium">{totalUsers} total</span>
                <button
                  onClick={() => refetchUsers()}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
                >
                  Refresh
                </button>
              </div>
            </div>

            {usersError && (
              <div className="p-4 border-b border-border bg-red-50 text-red-700 text-sm">
                {usersError.message}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersList?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{u.fullName || '—'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          u.isAdmin
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {u.isAdmin ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {u.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select
                            value={u.plan || 'free'}
                            onChange={(e) => setPlanMutation.mutate({ userId: u.id, plan: e.target.value as 'free' | 'pro' | 'vip' })}
                            className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-ring ${planBadge(u.plan)}`}
                          >
                            {PLAN_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <svg className="w-3 h-3 text-current opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {u.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActiveMutation.mutate({ userId: u.id, isActive: !u.isActive })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              u.isActive
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setHistoryUserId(u.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5"
                          >
                            <History className="w-3 h-3" />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {usersFetching && (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 text-sm text-muted-foreground">
                        Loading users...
                      </td>
                    </tr>
                  )}

                  {!usersFetching && (usersList?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Simple history drawer */}
            {historyUserId && (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/30" onClick={() => setHistoryUserId(null)} />
                <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-semibold text-slate-900">Plan History</h3>
                    </div>
                    <button
                      className="p-2 rounded-xl hover:bg-slate-100"
                      onClick={() => setHistoryUserId(null)}
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {(planHistoryData ?? []).map((h: any) => (
                      <div key={h.id} className="rounded-2xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-900">{h.plan}</div>
                          <div className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">Previous: {h.previousPlan || '—'}</div>
                        <div className="text-xs text-slate-600">Set by: {h.setBy || '—'}</div>
                      </div>
                    ))}
                    {(planHistoryData?.length ?? 0) === 0 && (
                      <div className="text-sm text-slate-500">No plan changes yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'settings' && (
          <ApiKeySettings />
        )}
      </div>
    </div>
  );
}
