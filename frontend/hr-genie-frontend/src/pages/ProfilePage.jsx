import React, { useState, useEffect } from 'react';
import { User, Mail, Building2, Calendar, Shield, Save, Edit3, Briefcase, Clock } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const ProfilePage = () => {
    const { user: authUser } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', department: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await authAPI.getMe();
            setProfile(res.data.user);
            setForm({ name: res.data.user.name, department: res.data.user.department || '' });
        } catch (err) {
            toast.error(t('profile.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/users/${profile.id}`, form);
            setProfile(prev => ({ ...prev, ...form }));
            setEditing(false);
            toast.success(t('profile.profileUpdated'));
        } catch (err) {
            toast.error(err.response?.data?.error || t('profile.failedToUpdate'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) return null;

    const roleBadge = {
        admin: 'bg-rose-50 text-rose-700 border-rose-200',
        hr: 'bg-violet-50 text-violet-700 border-violet-200',
        employee: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };

    const memberSince = new Date(profile.created_at).toLocaleDateString('en', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const hireDate = profile.hire_date
        ? new Date(profile.hire_date).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })
        : t('common.notSet');

    return (
        <div className="space-y-6 animate-fadeIn max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{t('profile.myProfile')}</h1>
                <p className="text-zinc-500 text-sm">{t('profile.viewManageInfo')}</p>
            </div>

            <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="w-16 h-16 bg-zinc-100 border border-zinc-200 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-zinc-900">
                            {profile.name?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h2 className="text-xl font-bold text-zinc-900">{profile.name}</h2>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide ${roleBadge[profile.role]}`}>
                                <Shield className="w-3 h-3" />
                                {profile.role}
                            </span>
                        </div>
                        <p className="text-zinc-500 text-[13px]">{profile.email}</p>
                        <p className="text-zinc-400 text-[12px] mt-1">{t('profile.memberSince')} {memberSince}</p>
                    </div>

                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shrink-0"
                        >
                            <Edit3 className="w-3.5 h-3.5" /> {t('common.edit')}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoCard icon={Mail} label={t('profile.email')} value={profile.email} />
                <InfoCard
                    icon={Building2}
                    label={t('auth.department')}
                    value={editing ? undefined : (profile.department || t('common.notAssigned'))}
                    editing={editing}
                    editValue={form.department}
                    onChange={v => setForm(f => ({ ...f, department: v }))}
                />
                <InfoCard
                    icon={User}
                    label={t('profile.fullName')}
                    value={editing ? undefined : profile.name}
                    editing={editing}
                    editValue={form.name}
                    onChange={v => setForm(f => ({ ...f, name: v }))}
                />
                <InfoCard icon={Briefcase} label={t('profile.role')} value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} />
                <InfoCard icon={Calendar} label={t('auth.hireDate')} value={hireDate} />
                <InfoCard icon={Clock} label={t('profile.memberSince')} value={memberSince} />
            </div>

            <div className="card p-6">
                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-4">{t('profile.leaveBalances')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-sky-50 border border-sky-100 rounded-md">
                        <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider mb-1">{t('leave.vacation')}</p>
                        <p className="text-2xl font-bold text-sky-900">{profile.vacation_balance ?? 0} <span className="text-[12px] text-sky-600 font-medium">{t('common.days')}</span></p>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-md">
                        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">{t('leave.sickLeave')}</p>
                        <p className="text-2xl font-bold text-amber-900">{profile.sick_leave_balance ?? 0} <span className="text-[12px] text-amber-600 font-medium">{t('common.days')}</span></p>
                    </div>
                </div>
            </div>

            {editing && (
                <div className="flex items-center gap-3 justify-end pt-2">
                    <button
                        onClick={() => { setEditing(false); setForm({ name: profile.name, department: profile.department || '' }); }}
                        className="px-4 py-2 border border-zinc-200 rounded-md text-[13px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-[13px] font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-3 h-3" />
                        {saving ? t('common.saving') : t('profile.saveChanges')}
                    </button>
                </div>
            )}
        </div>
    );
};

const InfoCard = ({ icon: Icon, label, value, editing, editValue, onChange }) => (
    <div className="card p-4 flex items-center gap-3">
        <div className="p-2 bg-zinc-100 rounded-md border border-zinc-200 shrink-0">
            <Icon className="w-4 h-4 text-zinc-500" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">{label}</p>
            {editing && onChange ? (
                <input
                    type="text"
                    value={editValue}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
            ) : (
                <p className="text-[14px] font-semibold text-zinc-900 truncate">{value}</p>
            )}
        </div>
    </div>
);

export default ProfilePage;
