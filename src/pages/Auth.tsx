import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Sparkles, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const retryCountRef = useRef(0);
  const warmedUpRef = useRef(false);

  // Warm up the server immediately when the page loads
  useEffect(() => {
    if (warmedUpRef.current) return;
    warmedUpRef.current = true;
    fetch('/api/warmup', { signal: AbortSignal.timeout(8000) }).catch(() => {});
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    retryCountRef.current = 0;

    if (isLogin) {
      try {
        const data = await attemptLogin(email, password);
        setIsSubmitting(false);
        retryCountRef.current = 0;
        setAuth(data.token, data.user);
        navigate(data.user.isAdmin ? '/admin' : '/app');
      } catch (err: any) {
        const msg = err.message || '';
        if (retryCountRef.current < 2 && (msg.includes('504') || msg.includes('timed out') || msg.includes('Unexpected token') || msg.includes('fetch failed') || msg.includes('starting'))) {
          retryCountRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
          setError(`Server is starting up... retrying (${retryCountRef.current}/3)`);
          setTimeout(() => {
            handleSubmit(e);
          }, delay);
          return;
        }
        setIsSubmitting(false);
        retryCountRef.current = 0;
        if (msg.includes('Database') || msg.includes('timed out') || msg.includes('504') || msg.includes('Unexpected token')) {
          setError('The server is still starting up. Please wait a moment and try again.');
        } else {
          setError(msg || 'Login failed. Please check your credentials.');
        }
      }
    } else {
      // Register via fetch to /api/trpc (bypasses tRPC client for cold start)
      try {
        const res = await fetch('/api/trpc/auth.register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 0: { email, password, name } }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message || 'Registration failed');
        const data = json.result?.data;
        if (!data) throw new Error('Registration failed');
        setIsSubmitting(false);
        retryCountRef.current = 0;
        setAuth(data.token, data.user);
        navigate('/app');
      } catch (err: any) {
        console.error('[auth] Register error:', err);
        setIsSubmitting(false);
        retryCountRef.current = 0;
        setError(err.message || 'Registration failed. Please try again.');
      }
    }
  };

  const attemptLogin = async (email: string, password: string, retries = 0): Promise<any> => {
    try {
      return await handleLogin(email, password);
    } catch (err: any) {
      const msg = err.message || '';
      if (retries < 2 && (msg.includes('504') || msg.includes('timed out') || msg.includes('Unexpected token') || msg.includes('fetch failed') || msg.includes('starting'))) {
        const delay = Math.min(1000 * Math.pow(2, retries + 1), 8000);
        await new Promise(r => setTimeout(r, delay));
        return attemptLogin(email, password, retries + 1);
      }
      throw err;
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail.trim()) {
      setError('Paki-enter ang iyong email');
      return;
    }
    try {
      const res = await fetch('/api/trpc/auth.forgotPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 0: { email: forgotEmail } }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || 'Request failed');
      setForgotSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

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
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
            {isLogin ? 'Mag-Log In' : 'Mag-Sign Up'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isLogin ? 'Welcome back! I-login ang iyong account.' : 'Gumawa ng bagong account para magsimula.'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  required
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

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setError(''); }}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Mag-Log In' : 'Mag-Sign Up'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setName(''); setEmail(''); setPassword(''); }}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              {isLogin ? 'Wala pang account? Mag-Sign Up' : 'May account na? Mag-Log In'}
            </button>
          </div>
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
