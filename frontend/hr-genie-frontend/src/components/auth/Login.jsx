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
  const [slowLogin, setSlowLogin] = useState(false);
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
    setSlowLogin(false);
    const slowTimer = setTimeout(() => setSlowLogin(true), 5000);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const isNetwork = !err.response && (err.code === 'ECONNABORTED' || err.message?.includes('Network Error'));
      setError(
        isNetwork
          ? 'The server is starting up. Please wait a moment and try again.'
          : err.response?.data?.error || t('auth.invalidCredentials')
      );
    } finally {
      clearTimeout(slowTimer);
      setSlowLogin(false);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#F7F7F6',
        fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
      }}
    >
      {/* Left panel — brand + features */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 flex-shrink-0"
        style={{ width: '400px', backgroundColor: '#1A1D23' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Logo className="w-8 h-8" color="#ffffff" />
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{t('common.appName')}</span>
        </div>

        {/* Copy */}
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '500', color: '#fff', lineHeight: '1.35', marginBottom: '12px' }}>
            Human Resources.<br />Engineered.
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '28px' }}>
            Manage your entire workforce — leave, payroll, performance, and compliance — from a single, focused tool.
          </p>

          {/* Feature list */}
          <div className="space-y-2.5">
            {[
              'AI assistant for instant HR answers',
              'Leave & approval workflows',
              'Payroll, shifts & timesheets',
              'Real-time attendance tracking',
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <span
                  style={{
                    width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#FFFFFF',
                    display: 'inline-block', flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)' }}>
          © {new Date().getFullYear()} Strata HR. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-16">
        <div style={{ maxWidth: '360px', width: '100%', paddingTop: '40px', paddingBottom: '40px' }}>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <Logo className="w-7 h-7" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#111318' }}>{t('common.appName')}</span>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: '500', color: '#111318', marginBottom: '4px' }}>
              {t('auth.signInToAccount')}
            </h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{t('auth.yourHrWorkspace')}</p>
          </div>

          {/* Session expired notice */}
          {sessionExpired && (
            <div
              className="flex items-center gap-2 mb-4 px-3 py-2 rounded"
              style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', fontSize: '12px', color: '#92400E' }}
            >
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              Your session expired. Please sign in again.
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 mb-4 px-3 py-2 rounded"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', fontSize: '12px', color: '#DC2626' }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
                {t('auth.emailAddress')}
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: '#D1D5DB' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  className="input"
                  style={{ paddingLeft: '34px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  {t('auth.password')}
                </label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '12px', color: '#111318' }}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: '#D1D5DB' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="input"
                  style={{ paddingLeft: '34px', paddingRight: '36px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#D1D5DB', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#6B7280'}
                  onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
              style={{ padding: '9px 16px', fontSize: '13px', marginTop: '4px' }}
            >
              {loading
                ? (slowLogin ? 'Server is starting up…' : t('auth.signingIn'))
                : <>{t('auth.signIn')} <ArrowRight className="w-3.5 h-3.5" /></>
              }
            </button>
          </form>

          <p style={{ marginTop: '20px', fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>
            {t('auth.dontHaveAccount')}{' '}
            <Link to="/register" style={{ color: '#111318', fontWeight: '500' }}>
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;