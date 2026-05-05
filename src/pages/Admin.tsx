import { useState } from 'react';
import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import { Users, Settings, Shield, CheckCircle, XCircle, Key, Save, Check, Star, Crown, Sparkles } from 'lucide-react';

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free', icon: Sparkles, color: 'text-gray-500' },
  { value: 'pro', label: 'Pro', icon: Crown, color: 'text-amber-500' },
  { value: 'vip', label: 'VIP', icon: Star, color: 'text-purple-500' },
] as const;

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'users' | 'settings'>('users');
  const [apiKey, setApiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');

  const { data: usersList, refetch: refetchUsers } = trpc.user.list.useQuery();
  const { data: apiKeyData, refetch: refetchApiKey } = trpc.settings.getApiKey.useQuery();
  const { data: deepseekKeyData, refetch: refetchDeepseekKey } = trpc.settings.getDeepseekKey.useQuery();
  const setApiKeyMutation = trpc.settings.setApiKey.useMutation({
    onSuccess: () => refetchApiKey(),
  });
  const [deepseekSaved, setDeepseekSaved] = useState(false);
  const setDeepseekKeyMutation = trpc.settings.setDeepseekKey.useMutation({
    onSuccess: () => {
      refetchDeepseekKey();
      setDeepseekSaved(true);
      setTimeout(() => setDeepseekSaved(false), 2000);
    },
  });

  const toggleActiveMutation = trpc.user.toggleActive.useMutation({
    onSuccess: () => refetchUsers(),
  });

  const setPlanMutation = trpc.user.setPlan.useMutation({
    onSuccess: () => refetchUsers(),
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Admin access required.</p>
          <button onClick={() => navigate('/app')} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg shadow-primary/20">
            Back to App
          </button>
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
                      <td className="px-6 py-4">
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
              <p className="text-sm text-muted-foreground mb-5">
                Used for AI image generation and chat.
              </p>
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
              <p className="text-sm text-muted-foreground mb-5">
                Used for AI ad copy analysis, sales wizard, and FB Ads Targeting.
              </p>
              <div className="space-y-3">
                <input
                  type="password"
                  value={deepseekKey || deepseekKeyData?.apiKey || ''}
                  onChange={(e) => setDeepseekKey(e.target.value)}
                  placeholder="Enter your Deepseek API key"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={() => setDeepseekKeyMutation.mutate({ apiKey: deepseekKey })}
                  disabled={!deepseekKey}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {deepseekSaved ? <Check className="w-4 h-4 stroke-[1.5]" /> : <Save className="w-4 h-4 stroke-[1.5]" />}
                  {deepseekSaved ? 'Saved!' : 'Save Deepseek Key'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
