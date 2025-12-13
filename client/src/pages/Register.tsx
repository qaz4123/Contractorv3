import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services';
import { Hammer, Loader2, CheckCircle } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Check password has at least one letter and one number
    if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one letter and one number');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company: formData.companyName || undefined,
      });
      
      // Validate response structure
      if (!response.success || !response.user || !response.tokens) {
        setError(response.error || 'Registration failed. Please try again.');
        return;
      }
      
      // setAuth stores refreshToken in Zustand, which persists to localStorage automatically
      setAuth(response.user, response.tokens.accessToken, response.tokens.refreshToken);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: string; retryAfter?: number }; headers?: Record<string, string> } };
      
      // Handle rate limiting (429 error)
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 
          parseInt(error.response?.headers?.['retry-after'] || '3600', 10);
        const minutes = Math.ceil(retryAfter / 60);
        setError(`Too many registration attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`);
      } else {
        setError(error.response?.data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'AI-powered lead intelligence',
    'Smart quote management',
    'Project tracking & analytics',
    'Subcontractor marketplace',
    'Invoice & payment tracking',
  ];

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
          to="/login"
          className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          Already have an account?
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex justify-center items-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-10 right-20 w-72 h-72 bg-emerald-400/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl w-full flex gap-12 relative z-10">
          {/* Left Side - Features */}
          <div className="hidden lg:flex flex-col justify-center flex-1">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Start Your Free Trial
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Join thousands of contractors who are growing their business with ContractorCRM.
            </p>
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="text-emerald-500" size={20} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 p-4 bg-white/60 backdrop-blur rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-indigo-600">14-day free trial</span>
                {' '}• No credit card required • Cancel anytime
              </p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
            <div className="text-center mb-6 lg:hidden">
              <h1 className="text-2xl font-bold text-slate-900">Create Your Account</h1>
              <p className="text-slate-500 mt-2">Start your 14-day free trial</p>
            </div>
            <div className="hidden lg:block text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Create Your Account</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none 
                             placeholder:text-slate-400 bg-white text-slate-900 transition-shadow"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none 
                             placeholder:text-slate-400 bg-white text-slate-900 transition-shadow"
                    placeholder="ABC Contractors"
                  />
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none 
                             placeholder:text-slate-400 bg-white text-slate-900 transition-shadow"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <span className="text-sm text-slate-600">
                  I agree to the{' '}
                  <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
                </span>
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
                    Creating account...
                  </>
                ) : (
                  'Start Free Trial'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
