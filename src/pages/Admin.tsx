import { useState } from 'react';
import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import {
  Users, Settings, Shield, CheckCircle, XCircle, Key, Save, Check,
  Star, Crown, Sparkles, X, Clock, History, ArrowRight,
} from 'lucide-react';

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free', icon: Sparkles, color: 'text-gray-500' },
  { value: 'pro', label: 'Pro', icon: Crown, color: 'text-amber-500' },
  { value: 'vip', label: 'VIP', icon: Star, color: 'text-purple-500' },
] as const;

const PLAN_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  pro: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  vip: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'users' | 'settings'>('users');
  const [apiKey, setApiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [historyUserId, setHistoryUserId] = useState<number | null>(null);

  const { data: usersList, refetch: refetchUsers } = trpc.user.list.useQuery();
  const { data: apiKeyData, refetch: refetchApiKey } = trpc.settings.getApiKey.useQuery();
  const { data: deepseekKeyData, refetch: refetchDeepseekKey } = trpc.settings.getDeepseekKey.useQuery();
  const { data: openaiKeyData, refetch: refetchOpenaiKey } = trpc.settings.getOpenaiKey.useQuery();
  const { data: planHistoryData, refetch: refetchPlanHistory } = trpc.user.planHistory.useQuery(
    { userId: historyUserId ?? 0 },
    { enabled: historyUserId !== null },
  );

  const setApiKeyMutation = trpc.settings.setApiKey.useMutation({ onSuccess: () => refetchApiKey() });
  const [deepseekSaved, setDeepseekSaved] = useState(false);
  const [deepseekError, setDeepseekError] = useState('');
  const setDeepseekKeyMutation = trpc.settings.setDeepseekKey.useMutation({
    onSuccess: () => {
      refetchDeepseekKey();
      setDeepseekSaved(true);
      setDeepseekError('');
      setTimeout(() => setDeepseekSaved(false), 2000);
    },
    onError: (err) => setDeepseekError(err.message),
  });
  const [openaiSaved, setOpenaiSaved] = useState(false);
  const [openaiError, setOpenaiError] = useState('');
  const setOpenaiKeyMutation = trpc.settings.setOpenaiKey.useMutation({
    onSuccess: () => {
      refetchOpenaiKey();
      setOpenaiSaved(true);
      setOpenaiError('');
      setTimeout(() => setOpenaiSaved(false), 2000);
    },
    onError: (err) => setOpenaiError(err.message),
  });

  const toggleActiveMutation = trpc.user.toggleActive.useMutation({ onSuccess: () => refetchUsers() });
  const setPlanMutation = trpc.user.setPlan.useMutation({ onSuccess: () => refetchUsers() });

  const [promoting, setPromoting] = useState(false);
  const [promoteMsg, setPromoteMsg] = useState('');
  const [promoteError, setPromoteError] = useState('');

  const handlePromote = async () => {
    if (!user?.email) return;
    setPromoting(true);
    setPromoteMsg('');
    setPromoteError('');
    try {
      const res = await fetch('/api/promote-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.success) {
        setPromoteMsg('You are now an admin! Please log out and log back in.');
      } else {
        setPromoteError(data.error || 'Failed to promote');
      }
    } catch (err: any) {
      setPromoteError(err.message);
    } finally {
      setPromoting(false);
    }
  };

  const openHistory = (userId: number) => {
    setHistoryUserId(userId);
    refetchPlanHistory();
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in max-w-md mx-auto px-4">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Admin access required.</p>
          {promoteMsg && (
            <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{promoteMsg}</p>
            </div>
          )}
          {promoteError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-700 dark:text-red-400">{promoteError}</p>
            </div>
          )}
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={handlePromote}
              disabled={promoting}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {promoting ? 'Promoting...' : 'Promote me to Admin'}
            </button>
            <button onClick={() => navigate('/app')} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm font-semibold">
              Back to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage users, settings, and API keys.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl card-shadow border border-border w-fit mb-8">
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
          <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden animate-fade-in-up">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
                <Users className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
                Registered Users
              </h2>
              <span className="text-sm text-muted-foreground font-medium">{usersList?.length ?? 0} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activated</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersList?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-muted-foreground">{u.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{u.name}</td>
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
                            className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
                              u.plan === 'vip'
                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
                                : u.plan === 'pro'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
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
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {u.activatedAt
                          ? new Date(u.activatedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                          : <span className="text-muted-foreground/50 italic">Not yet</span>}
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
                            onClick={() => openHistory(u.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-1"
                          >
                            <History className="w-3 h-3" />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="max-w-2xl space-y-6 animate-fade-in-up">
            {/* FAL API Key */}
            <div className="bg-card rounded-2xl card-shadow border border-border p-6">
              <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2.5">
                <Key className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
                FAL API Key
              </h2>
              <p className="text-sm text-muted-foreground mb-5">Used for AI image generation and chat.</p>
              <div className="space-y-3">
                <input
                  type="password"
                  value={apiKey || apiKeyData?.apiKey || ''}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your fal.ai API key"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={() => setApiKeyMutation.mutate({ apiKey })}
                  disabled={!apiKey}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  <Save className="w-4 h-4 stroke-[1.5]" />
                  Save API Key
                </button>
              </div>
            </div>

            {/* Deepseek API Key */}
            <div className="bg-card rounded-2xl card-shadow border border-border p-6">
              <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2.5">
                <Key className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
                Deepseek API Key
              </h2>
              <p className="text-sm text-muted-foreground mb-5">Used for AI ad copy analysis, sales wizard, and FB Ads Targeting.</p>
              <div className="space-y-3">
                <input
                  type="password"
                  value={deepseekKey || deepseekKeyData?.apiKey || ''}
                  onChange={(e) => setDeepseekKey(e.target.value)}
                  placeholder="Enter your Deepseek API key"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={() => setDeepseekKeyMutation.mutate({ apiKey: deepseekKey || deepseekKeyData?.apiKey || '' })}
                  disabled={!deepseekKey && !deepseekKeyData?.apiKey}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {deepseekSaved ? <Check className="w-4 h-4 stroke-[1.5]" /> : <Save className="w-4 h-4 stroke-[1.5]" />}
                  {deepseekSaved ? 'Saved!' : 'Save Deepseek Key'}
                </button>
                {deepseekError && <p className="text-sm text-red-500 mt-2">{deepseekError}</p>}
              </div>
            </div>

            {/* OpenAI API Key */}
            <div className="bg-card rounded-2xl card-shadow border border-border p-6">
              <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2.5">
                <Key className="w-5 h-5 text-emerald-500 stroke-[1.5]" />
                OpenAI API Key
              </h2>
              <p className="text-sm text-muted-foreground mb-5">Used for AI image analysis (Image Ad Analyzer). GPT-4o-mini processes the actual image.</p>
              <div className="space-y-3">
                <input
                  type="password"
                  value={openaiKey || openaiKeyData?.apiKey || ''}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={() => setOpenaiKeyMutation.mutate({ apiKey: openaiKey || openaiKeyData?.apiKey || '' })}
                  disabled={!openaiKey && !openaiKeyData?.apiKey}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {openaiSaved ? <Check className="w-4 h-4 stroke-[1.5]" /> : <Save className="w-4 h-4 stroke-[1.5]" />}
                  {openaiSaved ? 'Saved!' : 'Save OpenAI Key'}
                </button>
                {openaiError && <p className="text-sm text-red-500 mt-2">{openaiError}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan History Modal */}
      {historyUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHistoryUserId(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[80vh] overflow-hidden animate-fade-in-up">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Plan History</h3>
                  <p className="text-xs text-gray-500">
                    {usersList?.find((u: any) => u.id === historyUserId)?.name || `User #${historyUserId}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryUserId(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!planHistoryData || planHistoryData.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No plan changes recorded yet.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Plan changes will appear here once you set a plan for this user.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {planHistoryData.map((entry: any) => {
                    const currentBadge = PLAN_BADGES[entry.plan] || PLAN_BADGES.free;
                    const prevBadge = PLAN_BADGES[entry.previousPlan] || PLAN_BADGES.free;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${prevBadge.bg} ${prevBadge.text} ${prevBadge.border} border`}>
                              {entry.previousPlan || 'None'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border} border`}>
                              {entry.plan}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(entry.createdAt).toLocaleDateString('en-PH', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {entry.setBy && <span> &middot; by {entry.setBy}</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
