import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Building2, Users, Copy, RefreshCw, Settings, Check, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const OrgSettingsPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const [org, setOrg] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editName, setEditName] = useState('');
    const [editing, setEditing] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchOrg();
        fetchMembers();
    }, []);

    const fetchOrg = async () => {
        try {
            const res = await api.get('/org');
            setOrg(res.data.organization);
            setEditName(res.data.organization.name);
        } catch { toast.error(t('orgSettings.failedToLoad')); }
        finally { setLoading(false); }
    };

    const fetchMembers = async () => {
        try {
            const res = await api.get('/org/members');
            setMembers(res.data.members);
        } catch { /* silent */ }
    };

    const handleUpdateName = async () => {
        try {
            await api.put('/org', { name: editName });
            toast.success(t('orgSettings.orgNameUpdated'));
            setEditing(false);
            fetchOrg();
        } catch { toast.error(t('orgSettings.updateFailed')); }
    };

    const handleRegenInvite = async () => {
        try {
            const res = await api.post('/org/invite-code');
            setOrg(prev => ({ ...prev, invite_code: res.data.invite_code }));
            toast.success(t('orgSettings.newInviteCode'));
        } catch { toast.error(t('orgSettings.regenFailed')); }
    };

    const copyInvite = () => {
        navigator.clipboard.writeText(org?.invite_code || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(t('orgSettings.inviteCodeCopied'));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
        );
    }

    const isAdmin = user?.role === 'admin';

    const roleColors = {
        admin: 'bg-red-50 text-red-700 border-red-200',
        hr: 'bg-amber-50 text-amber-700 border-amber-200',
        manager: 'bg-zinc-100 text-zinc-900 border-zinc-200',
        employee: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{t('orgSettings.title')}</h1>
                <p className="text-zinc-500 text-sm">{t('orgSettings.subtitle')}</p>
            </div>

            {/* Org Info Card */}
            <div className="bg-white border border-zinc-200 rounded-md p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 rounded-md flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-zinc-600" />
                    </div>
                    <div className="flex-1">
                        {editing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-zinc-900 text-lg font-bold outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 w-full max-w-sm"
                                />
                                <button onClick={handleUpdateName} className="bg-[#111318] hover:bg-[#374151] text-white px-4 py-2 rounded-md font-bold text-sm transition-colors">Save</button>
                                <button onClick={() => { setEditing(false); setEditName(org.name); }} className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors">Cancel</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-zinc-900 tracking-tight">{org?.name}</h2>
                                {isAdmin && (
                                    <button onClick={() => setEditing(true)} className="text-zinc-400 hover:text-zinc-900 transition-colors bg-zinc-50 hover:bg-zinc-100 p-1.5 rounded-md">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                        <p className="text-sm font-medium text-zinc-500 mt-1">{t('orgSettings.slug')}: <span className="text-zinc-900 font-bold">{org?.slug}</span> · {t('orgSettings.plan')}: <span className="text-zinc-900 font-bold capitalize">{org?.plan || 'free'}</span></p>
                    </div>
                </div>

                {/* Invite Code */}
                {isAdmin && (
                    <div className="bg-zinc-50 rounded-md p-5 border border-zinc-200">
                        <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1">{t('orgSettings.inviteCode')}</p>
                        <p className="text-sm font-medium text-zinc-600 mb-4">{t('orgSettings.inviteCodeDescription')}</p>
                        <div className="flex items-center gap-3">
                            <code className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 font-mono text-sm tracking-wider select-all shadow-sm font-bold">
                                {org?.invite_code}
                            </code>
                            <button onClick={copyInvite} className="bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-3 py-2.5 rounded-md shadow-sm transition-colors" title="Copy">
                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button onClick={handleRegenInvite} className="bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-3 py-2.5 rounded-md shadow-sm transition-colors" title="Regenerate">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Members List */}
            <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
                <div className="p-5 border-b border-zinc-200 flex items-center gap-3 bg-zinc-50">
                    <Users className="w-5 h-5 text-zinc-500" />
                    <h3 className="text-[14px] font-black text-zinc-900 uppercase tracking-widest">{t('orgSettings.teamMembers')} ({members.length})</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('orgSettings.name')}</th>
                                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('orgSettings.email')}</th>
                                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('orgSettings.department')}</th>
                                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('orgSettings.role')}</th>
                                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('orgSettings.joined')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {members.map(m => (
                                <tr key={m.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 text-[11px] font-black">
                                                {m.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <span className="text-zinc-900 font-bold text-[14px]">{m.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 font-medium text-[13px]">{m.email}</td>
                                    <td className="px-6 py-4 text-zinc-600 font-medium text-[13px]">{m.department || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${roleColors[m.role] || roleColors.employee}`}>
                                            {m.role === 'admin' && <Shield className="w-3 h-3" />}
                                            {m.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 font-medium text-[13px]">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrgSettingsPage;
