import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Bot, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new invitation.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/reset-password`, { token, password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        border: '1.5px solid #e4e4e7',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.15s',
        backgroundColor: '#fff',
        color: '#18181b',
        boxSizing: 'border-box',
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F5F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(91,79,232,0.08)' }}>
                {/* Header */}
                <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #f4f4f5', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', background: '#5B4FE8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Bot size={24} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#18181b', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                        {success ? 'Password Set!' : 'Set Your Password'}
                    </h1>
                    <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>
                        {success ? 'Redirecting you to login…' : 'Create a secure password for your HR Genie account.'}
                    </p>
                </div>

                <div style={{ padding: '28px 32px' }}>
                    {success ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <CheckCircle size={32} color="#16a34a" />
                            </div>
                            <p style={{ fontSize: '14px', color: '#3f3f46', margin: 0 }}>
                                Your password has been set. You can now log in with your email and new password.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {error && (
                                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                                    <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
                                </div>
                            )}

                            {!token ? null : (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3f3f46', marginBottom: '6px' }}>
                                            New Password
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                style={{ ...inputStyle, paddingRight: '44px' }}
                                                placeholder="Minimum 6 characters"
                                                required
                                                minLength={6}
                                                onFocus={e => e.target.style.borderColor = '#5B4FE8'}
                                                onBlur={e => e.target.style.borderColor = '#e4e4e7'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: '4px' }}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3f3f46', marginBottom: '6px' }}>
                                            Confirm Password
                                        </label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            style={inputStyle}
                                            placeholder="Repeat your password"
                                            required
                                            onFocus={e => e.target.style.borderColor = '#5B4FE8'}
                                            onBlur={e => e.target.style.borderColor = '#e4e4e7'}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            width: '100%', padding: '12px', background: loading ? '#a89cff' : '#5B4FE8',
                                            color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px',
                                            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <KeyRound size={16} />
                                        {loading ? 'Setting password…' : 'Set Password & Log In'}
                                    </button>
                                </>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
