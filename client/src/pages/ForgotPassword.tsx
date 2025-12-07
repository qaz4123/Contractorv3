import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hammer, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';

export function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      // Still show success to prevent email enumeration
      setSuccess(true);
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
          to="/login"
          className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md relative z-10">
          {success ? (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
              <p className="text-slate-600 mb-6">
                If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500 font-medium"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Forgot Password?</h1>
                <p className="text-slate-500 mt-2">
                  Enter your email and we'll send you a reset link
                </p>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none 
                             placeholder:text-slate-400 bg-white text-slate-900 transition-shadow"
                    placeholder="you@company.com"
                  />
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
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Remember your password?{' '}
                  <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
