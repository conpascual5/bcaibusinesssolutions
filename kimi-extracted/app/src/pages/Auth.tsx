import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Sparkles, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';

export default function Auth() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      console.log('[auth] Login success for:', data.user.email);
      setAuth(data.token, data.user);
      if (data.user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    },
    onError: (err) => {
      console.error('[auth] Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      console.log('[auth] Register success for:', data.user.email);
      setAuth(data.token, data.user);
      navigate('/app');
    },
    onError: (err) => {
      console.error('[auth] Register error:', err);
      setError(err.message || 'Registration failed. Email may already be in use.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      if (!name.trim()) {
        setError('Paki-enter ang iyong pangalan');
        return;
      }
      registerMutation.mutate({ email, password, name });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-900 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Mag-Log In' : 'Mag-Sign Up'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isLogin ? 'Welcome back! I-login ang iyong account.' : 'Gumawa ng libreng account ngayon.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pangalan</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Mag-Log In' : 'Mag-Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? 'Wala pang account?' : 'May account na?'}{' '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-blue-600 font-semibold hover:underline"
              >
                {isLogin ? 'Mag-Sign Up' : 'Mag-Log In'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          BC AI Business Solutions — Marketing Tool Kit
        </p>
      </div>
    </div>
  );
}
