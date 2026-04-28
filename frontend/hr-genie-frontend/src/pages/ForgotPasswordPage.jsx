import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Mail, Lock, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState('request'); // request | reset | done
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
            setMessage(res.data.message);
            // In dev mode, auto-fill the token if returned
            if (res.data.token) setToken(res.data.token);
            setStep('reset');
        } catch (err) {
            setError(err.response?.data?.error || t('forgotPassword.requestFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError(t('forgotPassword.passwordsDoNotMatch'));
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/reset-password`, { token, password });
            setStep('done');
        } catch (err) {
            setError(err.response?.data?.error || t('forgotPassword.resetFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="w-full max-w-md relative z-10 animate-fadeIn my-8">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mx-auto mb-5 shadow-sm border border-zinc-200">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        {step === 'done' ? t('forgotPassword.passwordReset') : step === 'reset' ? t('forgotPassword.setNewPassword') : t('forgotPassword.title')}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {step === 'done' ? t('forgotPassword.canNowLogin') : step === 'reset' ? t('forgotPassword.enterTokenAndPassword') : t('forgotPassword.enterEmail')}
                    </p>
                </div>

                <div className="bg-white border border-zinc-200 rounded-lg p-8 sm:p-10 shadow-sm animate-slideUp">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    {step === 'done' ? (
                        <div className="text-center">
                            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                            <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
                                {t('forgotPassword.goToLogin')}
                            </Link>
                        </div>
                    ) : step === 'reset' ? (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {message && <p className="text-[13px] font-medium text-green-800 bg-green-50 border border-green-100 rounded-md p-3">{message}</p>}
                            <div>
                                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('forgotPassword.resetToken')}</label>
                                <input
                                    type="text"
                                    value={token}
                                    onChange={e => setToken(e.target.value)}
                                    className="input w-full"
                                    placeholder={t('forgotPassword.pasteResetToken')}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('forgotPassword.newPassword')}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input w-full"
                                    placeholder={t('forgotPassword.atLeast6Chars')}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('forgotPassword.confirmPassword')}</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="input w-full"
                                    placeholder={t('forgotPassword.repeatPassword')}
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
                                {loading ? t('forgotPassword.resetting') : t('forgotPassword.resetPassword')}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRequestReset} className="space-y-4">
                            <div>
                                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">{t('auth.emailAddress')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="input w-full pl-10"
                                        placeholder="you@company.com"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
                                {loading ? t('common.sending') : t('forgotPassword.sendResetLink')}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm font-medium text-zinc-900 hover:underline flex items-center justify-center gap-1 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> {t('forgotPassword.backToLogin')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
