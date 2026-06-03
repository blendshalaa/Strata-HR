import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Building, AlertCircle, ArrowRight, Hash, Eye, EyeOff } from 'lucide-react';
import Logo from '../Logo';
import { useTranslation } from 'react-i18next';

const getStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: '#DC2626' };
  if (score <= 2) return { score, label: 'Fair',   color: '#B45309' };
  if (score <= 3) return { score, label: 'Good',   color: '#5B4FE8' };
  return             { score, label: 'Strong', color: '#059669' };
};

const StyledInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
    <input
      {...props}
      className="w-full pl-9 pr-10 py-2.5 rounded-lg text-[16px] sm:text-[14px] outline-none transition-all"
      style={{ backgroundColor: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', color: '#0F0D2E' }}
      onFocus={e => { e.target.style.borderColor = '#5B4FE8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
    />
    {props.children}
  </div>
);

const Register = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const inviteQuery = searchParams.get('invite');
  const [mode, setMode] = useState(inviteQuery ? 'join' : 'create');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    org_name: '', invite_code: inviteQuery || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const strength = getStrength(formData.password);
  const passwordsMatch = !formData.confirmPassword || formData.password === formData.confirmPassword;
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [slowRegister, setSlowRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setSlowRegister(false);

    // If registration takes >5s, show a "server waking up" hint
    const slowTimer = setTimeout(() => setSlowRegister(true), 5000);

    try {
      const { confirmPassword, ...payload } = formData;
      if (mode === 'create') {
        delete payload.invite_code;
        if (!payload.org_name.trim()) { setError(t('auth.orgNameRequired')); clearTimeout(slowTimer); setLoading(false); return; }
      } else {
        delete payload.org_name;
        if (!payload.invite_code.trim()) { setError(t('auth.inviteCodeRequired')); clearTimeout(slowTimer); setLoading(false); return; }
      }
      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      const isNetworkError = !err.response && (err.code === 'ECONNABORTED' || err.message?.includes('Network Error'));
      setError(
        isNetworkError
          ? 'The server is still waking up. Please wait a moment and try again.'
          : err.response?.data?.error || t('auth.registrationFailed')
      );
    } finally {
      clearTimeout(slowTimer);
      setSlowRegister(false);
      setLoading(false);
    }
  };

  const labelStyle = { color: '#0F0D2E', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F5F4FF', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-12 flex-shrink-0" style={{ backgroundColor: '#1E1B4B' }}>
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="text-white font-bold text-[17px]">{t('common.appName')}</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            {mode === 'create' ? 'Set up your\norganization' : 'Join your\nteam today'}
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {mode === 'create'
              ? 'Create your workspace and invite your team. You\'ll be the admin.'
              : 'Enter your invite code to join an existing organization.'}
          </p>
        </div>
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} HR Genie. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-[16px]" style={{ color: '#0F0D2E' }}>{t('common.appName')}</span>
          </div>

          <div className="mb-7">
            <h1 className="text-[24px] font-bold mb-1" style={{ color: '#0F0D2E' }}>{t('auth.signUp')}</h1>
            <p className="text-[14px]" style={{ color: '#6B7280' }}>{t('auth.createAccount')}</p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg mb-6" style={{ backgroundColor: '#EEF0FF' }}>
            {[
              { key: 'create', label: t('auth.createOrganization') },
              { key: 'join',   label: t('auth.joinWithInvite') },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className="flex-1 py-2 text-[13px] font-semibold rounded-md transition-all"
                style={{
                  backgroundColor: mode === key ? '#5B4FE8' : 'transparent',
                  color: mode === key ? '#fff' : '#5B4FE8',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 rounded-lg flex items-start gap-2.5" style={{ backgroundColor: '#FEF2F2', border: '0.5px solid #FECACA' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#DC2626' }} />
              <p className="text-[13px] font-medium" style={{ color: '#991B1B' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Org/Invite field */}
            {mode === 'create' ? (
              <div>
                <label style={labelStyle}>{t('auth.organizationName')}</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                  <input type="text" name="org_name" value={formData.org_name} onChange={handleChange}
                    placeholder="Acme Corp" autoComplete="organization" required
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[16px] sm:text-[14px] outline-none transition-all"
                    style={{ backgroundColor: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', color: '#0F0D2E' }}
                    onFocus={e => { e.target.style.borderColor = '#5B4FE8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <p className="text-[12px] mt-1.5" style={{ color: '#6B7280' }}>{t('auth.youllBeAdmin')}</p>
              </div>
            ) : (
              <div>
                <label style={labelStyle}>{t('auth.inviteCode')}</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                  <input type="text" name="invite_code" value={formData.invite_code} onChange={handleChange}
                    placeholder={t('auth.pasteInviteCode')} autoComplete="off" required
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[16px] sm:text-[14px] outline-none transition-all"
                    style={{ backgroundColor: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', color: '#0F0D2E' }}
                    onFocus={e => { e.target.style.borderColor = '#5B4FE8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <p className="text-[12px] mt-1.5" style={{ color: '#6B7280' }}>Ask your HR admin for your invite code.</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label style={labelStyle}>{t('auth.fullName')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="John Doe" autoComplete="name" required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[16px] sm:text-[14px] outline-none transition-all"
                  style={{ backgroundColor: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', color: '#0F0D2E' }}
                  onFocus={e => { e.target.style.borderColor = '#5B4FE8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>{t('auth.emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="you@company.com" autoComplete="email" required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[16px] sm:text-[14px] outline-none transition-all"
                  style={{ backgroundColor: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', color: '#0F0D2E' }}
                  onFocus={e => { e.target.style.borderColor = '#5B4FE8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                  onChange={handleChange} placeholder="Min. 8 characters"
                  autoComplete="new-password" required minLength={8}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg text-[16px] sm:text-[14px] outline-none transition-all"
                  style={{ backgroundColor: '#fff', border: '0.5px solid rgba(0,0,0,0.12)', color: '#0F0D2E' }}
                  onFocus={e => { e.target.style.borderColor = '#5B4FE8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#5B4FE8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: strength.score >= i ? strength.color : '#E5E7EB' }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-semibold" style={{ color: strength.color }}>{strength.label} password</p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} placeholder="Re-enter your password"
                  autoComplete="new-password" required
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg text-[16px] sm:text-[14px] outline-none transition-all"
                  style={{
                    backgroundColor: '#fff',
                    border: `0.5px solid ${!passwordsMatch ? '#DC2626' : 'rgba(0,0,0,0.12)'}`,
                    color: '#0F0D2E',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#5B4FE8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = !passwordsMatch ? '#DC2626' : 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#5B4FE8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-[11px] mt-1 font-medium" style={{ color: '#DC2626' }}>Passwords do not match.</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !passwordsMatch}
              className="w-full mt-2 py-2.5 rounded-lg text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{ backgroundColor: '#5B4FE8' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#4a3fd4'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#5B4FE8'; }}
            >
              {loading ? (slowRegister ? 'Server is waking up…' : t('auth.creatingAccount')) : (
                <>
                  {mode === 'create' ? t('auth.createOrgAndAccount') : t('auth.joinAndCreateAccount')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px]" style={{ color: '#6B7280' }}>
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#5B4FE8' }}>{t('auth.signInLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;