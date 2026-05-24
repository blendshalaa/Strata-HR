import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Building2, Calendar, Shield, Save, Edit3, Briefcase, Clock, Camera, Trash2, Loader2 } from 'lucide-react';
import { authAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

/* ─── Avatar Editor ────────────────────────────────────────────────── */
const AvatarEditor = ({ profile, onAvatarChange }) => {
    const toast = useToast();
    const { t } = useTranslation();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [hover, setHover] = useState(false);

    const initials = profile.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?';

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) {
            toast.error(t('profile.invalidFileType', 'Only JPG, PNG, WebP, and GIF images are allowed'));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('profile.fileTooLarge', 'Image must be under 5 MB'));
            return;
        }

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            const res = await userAPI.uploadAvatar(file);
            onAvatarChange(res.data.profile_picture);
            toast.success(t('profile.avatarUpdated', 'Profile picture updated'));
            setPreview(null);
        } catch (err) {
            toast.error(err.response?.data?.error || t('profile.avatarUploadFailed', 'Failed to upload picture'));
            setPreview(null);
        } finally {
            setUploading(false);
            // Reset input so re-selecting the same file works
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = async () => {
        setUploading(true);
        try {
            await userAPI.deleteAvatar();
            onAvatarChange(null);
            toast.success(t('profile.avatarRemoved', 'Profile picture removed'));
            setPreview(null);
        } catch (err) {
            toast.error(t('profile.avatarRemoveFailed', 'Failed to remove picture'));
        } finally {
            setUploading(false);
        }
    };

    const displayUrl = preview || profile.profile_picture;

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Avatar circle */}
            <div
                className="relative group cursor-pointer"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{ width: 96, height: 96 }}
            >
                {displayUrl ? (
                    <img
                        src={displayUrl}
                        alt={profile.name}
                        className="w-full h-full rounded-full object-cover border-2"
                        style={{ borderColor: '#E0DEFF' }}
                    />
                ) : (
                    <div
                        className="w-full h-full rounded-full flex items-center justify-center border-2"
                        style={{
                            background: 'linear-gradient(135deg, #5B4FE8 0%, #7C6FFF 100%)',
                            borderColor: '#E0DEFF',
                        }}
                    >
                        <span className="text-2xl font-bold text-white">{initials}</span>
                    </div>
                )}

                {/* Hover overlay */}
                <div
                    className="absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{
                        backgroundColor: hover && !uploading ? 'rgba(0,0,0,0.45)' : 'transparent',
                        opacity: hover && !uploading ? 1 : 0,
                    }}
                >
                    <Camera className="w-6 h-6 text-white" />
                </div>

                {/* Loading spinner overlay */}
                {uploading && (
                    <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="avatar-upload-input"
                />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                    style={{
                        backgroundColor: '#F5F4FF',
                        color: '#5B4FE8',
                        border: '1px solid #E0DEFF',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EBE9FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F5F4FF'; }}
                >
                    <Camera className="w-3 h-3" />
                    {t('profile.uploadPhoto', 'Upload Photo')}
                </button>

                {profile.profile_picture && (
                    <button
                        onClick={handleRemove}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                        style={{
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                    >
                        <Trash2 className="w-3 h-3" />
                        {t('profile.removePhoto', 'Remove')}
                    </button>
                )}
            </div>

            <p className="text-[11px] text-zinc-400 text-center">
                {t('profile.avatarHint', 'JPG, PNG, WebP or GIF · Max 5 MB')}
            </p>
        </div>
    );
};

/* ─── Profile Page ─────────────────────────────────────────────────── */
const ProfilePage = () => {
    const { user: authUser, refreshUser } = useAuth();
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
            refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.error || t('profile.failedToUpdate'));
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = (newUrl) => {
        setProfile(prev => ({ ...prev, profile_picture: newUrl }));
        refreshUser();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin" />
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
        <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto pb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">{t('profile.myProfile')}</h1>
                    <p className="text-zinc-500 text-[15px]">{t('profile.viewManageInfo')}</p>
                </div>
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 shadow-sm rounded-lg text-[14px] font-bold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all shrink-0"
                    >
                        <Edit3 className="w-4 h-4" /> {t('common.edit')}
                    </button>
                )}
            </div>

            {/* Profile Header Card */}
            <div className="relative overflow-hidden bg-white border border-zinc-200 rounded-2xl shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to right, #EEF0FF, #E0DEFF)' }}></div>
                <div className="relative p-6 sm:p-8 pt-12 sm:pt-16 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
                    <div className="relative z-10 p-1 bg-white rounded-full shadow-sm">
                        <AvatarEditor profile={profile} onAvatarChange={handleAvatarChange} />
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left mt-2">
                        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 mb-2">
                            <h2 className="text-2xl font-black text-zinc-900">{profile.name}</h2>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-widest shadow-sm ${roleBadge[profile.role]}`}>
                                <Shield className="w-3.5 h-3.5" />
                                {profile.role}
                            </span>
                        </div>
                        <p className="text-zinc-500 text-[15px] font-medium mb-3">{profile.email}</p>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 text-[13px] font-medium">
                            <Clock className="w-4 h-4" />
                            {t('profile.memberSince')} {memberSince}
                        </div>
                    </div>
                </div>
            </div>

            {editing && (
                <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                    <Edit3 className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-[14px] font-medium text-amber-800">You are currently editing your profile. Make your changes below and click <strong>Save Changes</strong> when done.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-4">
                    <h3 className="text-[14px] font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2">{t('profile.personalInfo', 'Personal Information')}</h3>
                    <div className="space-y-3">
                        <InfoCard icon={Mail} label={t('profile.email')} value={profile.email} />
                        <InfoCard
                            icon={User}
                            label={t('profile.fullName')}
                            value={editing ? undefined : profile.name}
                            editing={editing}
                            editValue={form.name}
                            onChange={v => setForm(f => ({ ...f, name: v }))}
                        />
                    </div>
                </div>

                {/* Employment Details */}
                <div className="space-y-4">
                    <h3 className="text-[14px] font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2">{t('profile.employmentDetails', 'Employment Details')}</h3>
                    <div className="space-y-3">
                        <InfoCard
                            icon={Building2}
                            label={t('auth.department')}
                            value={editing ? undefined : (profile.department || t('common.notAssigned'))}
                            editing={editing}
                            editValue={form.department}
                            onChange={v => setForm(f => ({ ...f, department: v }))}
                        />
                        <InfoCard icon={Briefcase} label={t('profile.role')} value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} />
                        <InfoCard icon={Calendar} label={t('auth.hireDate')} value={hireDate} />
                    </div>
                </div>
            </div>

            <div className="card p-8 border-none shadow-sm mt-4">
                <h3 className="text-[14px] font-black text-zinc-900 uppercase tracking-widest mb-6">{t('profile.leaveBalances', 'Leave Balances')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-6 bg-sky-50/50 border border-sky-100 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-[12px] font-black text-sky-700 uppercase tracking-widest mb-1">{t('leave.vacation', 'Vacation')}</p>
                            <p className="text-[13px] font-medium text-sky-600/80">Available paid time off</p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-black text-sky-900">{profile.vacation_balance ?? 0}</p>
                            <p className="text-[12px] text-sky-600 font-bold uppercase tracking-wider">{t('common.days', 'Days')}</p>
                        </div>
                    </div>
                    <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-[12px] font-black text-amber-700 uppercase tracking-widest mb-1">{t('leave.sickLeave', 'Sick Leave')}</p>
                            <p className="text-[13px] font-medium text-amber-600/80">Available sick time off</p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-black text-amber-900">{profile.sick_leave_balance ?? 0}</p>
                            <p className="text-[12px] text-amber-600 font-bold uppercase tracking-wider">{t('common.days', 'Days')}</p>
                        </div>
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
                        className="flex items-center gap-2 px-4 py-2 bg-[#5B4FE8] text-white rounded-md text-[13px] font-semibold hover:bg-[#4a3fd4] transition-colors disabled:opacity-50"
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
    <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-4 transition-all hover:border-[#C4BDFF] shadow-sm">
        <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100 shrink-0">
            <Icon className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase font-black tracking-widest text-zinc-400 mb-1">{label}</p>
            {editing && onChange ? (
                <input
                    type="text"
                    value={editValue}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-md px-3 py-2 text-[14px] font-medium text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-2 focus:ring-[#EEF0FF] transition-all"
                />
            ) : (
                <p className="text-[15px] font-bold text-zinc-900 truncate">{value}</p>
            )}
        </div>
    </div>
);

export default ProfilePage;
