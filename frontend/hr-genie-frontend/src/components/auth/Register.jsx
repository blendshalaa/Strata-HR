import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bot, Mail, Lock, User, Building, AlertCircle, ArrowRight, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const inviteQuery = searchParams.get('invite');

  const [mode, setMode] = useState(inviteQuery ? 'join' : 'create');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    hire_date: '',
    org_name: '',
    invite_code: inviteQuery || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { ...formData };
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

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm";

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
                  <input type="text" name="org_name" value={formData.org_name} onChange={handleChange} className={inputClass} placeholder="Acme Corp" required />
                </div>
                <p className="text-[12px] text-zinc-500 mt-1.5">{t('auth.youllBeAdmin')}</p>
              </div>
            ) : (
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.inviteCode')}</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" name="invite_code" value={formData.invite_code} onChange={handleChange} className={inputClass} placeholder={t('auth.pasteInviteCode')} required />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.fullName')}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="John Doe" required />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="you@company.com" required />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} placeholder="••••••••" required minLength={6} />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.department')}</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" name="department" value={formData.department} onChange={handleChange} className={inputClass} placeholder="Engineering" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('auth.hireDate')}</label>
              <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm" />
            </div>

            <button
              type="submit"
              disabled={loading}
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