import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bot, Mail, Lock, User, Building, AlertCircle, ArrowRight, Hash, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Password strength scorer
const getStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-yellow-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

const Register = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const inviteQuery = searchParams.get('invite');

  const [mode, setMode] = useState(inviteQuery ? 'join' : 'create');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    org_name: '',
    invite_code: inviteQuery || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const strength = getStrength(formData.password);
  const passwordsMatch = !formData.confirmPassword || formData.password === formData.confirmPassword;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...payload } = formData;
      if (mode === 'create') {
        delete payload.invite_code;
        if (!payload.org_name.trim()) {
          setError(t('auth.orgNameRequired'));
          setLoading(false);
          return;
        }
      } else {
        delete payload.org_name;
        if (!payload.invite_code.trim()) {
          setError(t('auth.inviteCodeRequired'));
          setLoading(false);
          return;
        }
      }

      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-10 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm";

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="max-w-md w-full relative z-10 my-8">
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 rounded-lg mb-5 shadow-sm border border-zinc-200">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-1 tracking-tight">{t('common.appName')}</h1>
          <p className="text-sm text-zinc-500 font-medium">{t('auth.createAccount')}</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-8 sm:p-10 shadow-sm animate-slideUp">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">{t('auth.signUp')}</h2>

          {/* Org Mode Toggle */}
          <div className="flex gap-2 mb-6 bg-zinc-100 p-1 rounded-md">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${mode === 'create' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              {t('auth.createOrganization')}
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${mode === 'join' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              {t('auth.joinWithInvite')}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Org field */}
            {mode === 'create' ? (
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.organizationName')}</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" name="org_name" value={formData.org_name} onChange={handleChange} className={inputClass} placeholder="Acme Corp" autoComplete="organization" required />
                </div>
                <p className="text-[12px] text-zinc-500 mt-1.5">{t('auth.youllBeAdmin')}</p>
              </div>
            ) : (
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.inviteCode')}</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" name="invite_code" value={formData.invite_code} onChange={handleChange} className={inputClass} placeholder={t('auth.pasteInviteCode')} autoComplete="off" required />
                </div>
                <p className="text-[12px] text-zinc-500 mt-1.5">Ask your HR admin for your invite code.</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.fullName')}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="John Doe" autoComplete="name" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="you@company.com" autoComplete="email" required />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
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

              {/* Strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength.score >= i ? strength.color : 'bg-zinc-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] font-medium ${
                    strength.label === 'Weak' ? 'text-red-500' :
                    strength.label === 'Fair' ? 'text-yellow-600' :
                    strength.label === 'Good' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`${inputClass} ${!passwordsMatch ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-[11px] text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordsMatch}
              className="w-full mt-2 py-2.5 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? t('auth.creatingAccount') : (
                <>
                  {mode === 'create' ? t('auth.createOrgAndAccount') : t('auth.joinAndCreateAccount')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-zinc-900 hover:underline font-medium transition-colors">
                {t('auth.signInLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;