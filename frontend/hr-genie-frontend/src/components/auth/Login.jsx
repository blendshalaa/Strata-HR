import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bot, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('session_expired')) {
      setSessionExpired(true);
      sessionStorage.removeItem('session_expired');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-10 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm";

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 rounded-lg mb-5 shadow-sm border border-zinc-200">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-1 tracking-tight">{t('common.appName')}</h1>
          <p className="text-sm text-zinc-500 font-medium">{t('auth.yourHrWorkspace')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-8 sm:p-10 shadow-sm animate-slideUp">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">{t('auth.signInToAccount')}</h2>

          {sessionExpired && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 font-medium">Your session expired. Please sign in again.</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                {t('auth.emailAddress')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-zinc-700">
                  {t('auth.password')}
                </label>
                <Link to="/forgot-password" className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? t('auth.signingIn') : (
                <>
                  {t('auth.signIn')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/register" className="text-zinc-900 hover:underline font-medium transition-colors">
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[13px] text-zinc-400 mt-8">
          {t('auth.poweredBy')}
        </p>
      </div>
    </div>
  );
};

export default Login;