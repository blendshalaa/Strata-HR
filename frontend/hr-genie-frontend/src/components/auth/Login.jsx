import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Clock } from 'lucide-react';
import Logo from '../Logo';
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

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#F5F4FF', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-12 flex-shrink-0"
        style={{ backgroundColor: '#1E1B4B' }}
      >
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="text-white font-bold text-[17px]">{t('common.appName')}</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Your AI-powered<br />HR workspace
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Manage leave, payroll, performance, and your team — all in one place.
          </p>

          <div className="mt-10 space-y-3">
            {[
              'AI Copilot for instant HR answers',
              'Leave & payroll in seconds',
              'Real-time team insights',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(91,79,232,0.4)' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#A89CFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} HR Genie. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-[16px]" style={{ color: '#0F0D2E' }}>{t('common.appName')}</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[24px] font-bold mb-1" style={{ color: '#0F0D2E' }}>
              {t('auth.signInToAccount')}
            </h1>
            <p className="text-[14px]" style={{ color: '#6B7280' }}>{t('auth.yourHrWorkspace')}</p>
          </div>

          {/* Alerts */}
          {sessionExpired && (
            <div className="mb-5 p-3 rounded-lg flex items-start gap-2.5" style={{ backgroundColor: '#FFF8EB', border: '0.5px solid #FDE68A' }}>
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B45309' }} />
              <p className="text-[13px] font-medium" style={{ color: '#92400E' }}>Your session expired. Please sign in again.</p>
            </div>
          )}
          {error && (
            <div className="mb-5 p-3 rounded-lg flex items-start gap-2.5" style={{ backgroundColor: '#FEF2F2', border: '0.5px solid #FECACA' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#DC2626' }} />
              <p className="text-[13px] font-medium" style={{ color: '#991B1B' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#0F0D2E' }}>
                {t('auth.emailAddress')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[16px] sm:text-[14px] outline-none transition-all"
                  style={{
                    backgroundColor: '#fff',
                    border: '0.5px solid rgba(0,0,0,0.12)',
                    color: '#0F0D2E',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#5B4FE8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-semibold" style={{ color: '#0F0D2E' }}>
                  {t('auth.password')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[13px] font-medium transition-colors"
                  style={{ color: '#5B4FE8' }}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg text-[16px] sm:text-[14px] outline-none transition-all"
                  style={{
                    backgroundColor: '#fff',
                    border: '0.5px solid rgba(0,0,0,0.12)',
                    color: '#0F0D2E',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#5B4FE8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#5B4FE8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{ backgroundColor: loading ? '#7B6EF0' : '#5B4FE8' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#4a3fd4'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#5B4FE8'; }}
            >
              {loading ? t('auth.signingIn') : (
                <>
                  {t('auth.signIn')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px]" style={{ color: '#6B7280' }}>
            {t('auth.dontHaveAccount')}{' '}
            <Link
              to="/register"
              className="font-semibold transition-colors"
              style={{ color: '#5B4FE8' }}
            >
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;