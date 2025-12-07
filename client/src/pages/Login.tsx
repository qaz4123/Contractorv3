import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services';
import { Hammer, Loader2 } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      setAuth(response.user, response.tokens.accessToken);
      // Store refresh token for later use
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: string; retryAfter?: number }; headers?: Record<string, string> } };
      
      // Handle rate limiting (429 error)
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 
          parseInt(error.response?.headers?.['retry-after'] || '900', 10);
        const minutes = Math.ceil(retryAfter / 60);
        setError(`Too many login attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`);
      } else {
        setError(error.response?.data?.error || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <nav className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-indigo-900">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Hammer size={20} />
          </div>
          ContractorCRM
        </Link>
        <Link
          to="/register"
          className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          Need an account?
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none 
                         placeholder:text-slate-400 bg-white text-slate-900 transition-shadow"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none 
                         placeholder:text-slate-400 bg-white text-slate-900 transition-shadow"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 
                       transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Start free trial
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          © 2025 ContractorCRM. All rights reserved.
        </div>
      </div>
    </div>
  );
}
