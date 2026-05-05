import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Sparkles, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';

export default function Auth() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const retryCountRef = useRef(0);
  const warmedUpRef = useRef(false);

  // Warm up the server immediately when the page loads
  // This triggers the cold start in the background so login is instant
  useEffect(() => {
    if (warmedUpRef.current) return;
    warmedUpRef.current = true;
    // Use the lightweight warmup endpoint that returns immediately
    // and triggers DB module loading in the background
    fetch('/api/warmup', { signal: AbortSignal.timeout(8000) }).catch(() => {
      // Silent — warm-up is best-effort
    });
  }, []);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      console.log('[auth] Login success for:', data.user.email);
      setIsSubmitting(false);
      retryCountRef.current = 0;
      setAuth(data.token, data.user);
      if (data.user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    },
    onError: (err) => {
      console.error('[auth] Login error:', err);
      const msg = err.message || '';
      // Retry on timeout/504 errors (server cold start)
      if (retryCountRef.current < 2 && (msg.includes('504') || msg.includes('timed out') || msg.includes('Unexpected token') || msg.includes('fetch failed'))) {
        retryCountRef.current += 1;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
        setError(`Server is starting up... retrying (${retryCountRef.current}/3)`);
        setTimeout(() => {
          loginMutation.mutate({ email, password });
        }, delay);
        return;
      }
      setIsSubmitting(false);
      retryCountRef.current = 0;
      if (msg.includes('Database connection failed') || msg.includes('timed out') || msg.includes('504') || msg.includes('Unexpected token')) {
        setError('The server is still starting up. Please wait a moment and try again.');
      } else {
        setError(msg || 'Login failed. Please check your credentials.');
      }
    },
  });

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      retryCountRef.current = 0;
      setForgotSent(true);
    },
    onError: (err) => {
      const msg = err.message || '';
      if (retryCountRef.current < 2 && (msg.includes('504') || msg.includes('timed out') || msg.includes('Unexpected token') || msg.includes('fetch failed'))) {
        retryCountRef.current += 1;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
        setTimeout(() => {
          forgotPasswordMutation.mutate({ email: forgotEmail });
        }, delay);
        return;
      }
      retryCountRef.current = 0;
      setError(msg || 'Something went wrong. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    retryCountRef.current = 0;
    loginMutation.mutate({ email, password });
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail.trim()) {
      setError('Paki-enter ang iyong email');
      return;
    }
    forgotPasswordMutation.mutate({ email: forgotEmail });
  };

  const isLoading = isSubmitting || loginMutation.isPending;

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <button
              onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(''); setError(''); }}
              className="inline-flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
            <p className="text-gray-500 mt-1">Enter your email and we'll send you a reset link.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {forgotSent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Check Your Email</h3>
                <p className="text-sm text-gray-500 mb-6">
                  If that email is registered, we've sent a password reset link.
                </p>
                <button
                  onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(''); }}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {forgotPasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

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
            Mag-Log In
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back! I-login ang iyong account.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="text-right">
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setError(''); }}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Mag-Log In
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          BC AI Business Solutions — Social Trend Analyzer
        </p>
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Admin login: <span className="text-gray-500">conpascual5@gmail.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
