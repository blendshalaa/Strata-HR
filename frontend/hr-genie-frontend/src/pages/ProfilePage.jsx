import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Building2, Calendar, Shield, Save, Edit3, Briefcase, Clock, Camera, Trash2, Upload } from 'lucide-react';
import { authAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

/* ── Avatar component with upload overlay ─────────────────────────────────── */
const AvatarEditor = ({ profile, onUpload, onRemove, uploading }) => {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Show instant local preview
        const url = URL.createObjectURL(file);
        setPreview(url);
        await onUpload(file);
        URL.revokeObjectURL(url);
        setPreview(null);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const src = preview || profile.profile_picture;
    const initials = profile.name?.charAt(0)?.toUpperCase();

    return (
        <div className="relative group shrink-0">
            {/* Avatar circle */}
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-200 bg-zinc-100 flex items-center justify-center">
                {src ? (
                    <img
                        src={src}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-2xl font-bold text-zinc-900">{initials}</span>
                )}
                {/* Upload overlay */}
                {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Camera button — always visible (not just on hover) */}
            {!uploading && (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Change profile picture"
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#5B4FE8] hover:bg-[#4a3fd4] text-white rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer"
                >
                    <Camera className="w-3.5 h-3.5" />
                </button>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                id="avatar-file-input"
            />
        </div>
    );
};

/* ── Main page ────────────────────────────────────────────────────────────── */
const ProfilePage = () => {
    const { user: authUser, updateUser } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
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

    const handleAvatarUpload = async (file) => {
        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const res = await userAPI.uploadAvatar(formData);
            const newPic = res.data.profile_picture;
            setProfile(prev => ({ ...prev, profile_picture: newPic }));
            updateUser({ profile_picture: newPic });
            toast.success('Profile picture updated!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to upload picture');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleAvatarRemove = async () => {
        if (!profile.profile_picture) return;
        setAvatarUploading(true);
        try {
            await userAPI.deleteAvatar();
            setProfile(prev => ({ ...prev, profile_picture: null }));
            updateUser({ profile_picture: null });
            toast.success('Profile picture removed');
        } catch (err) {
            toast.error('Failed to remove picture');
        } finally {
            setAvatarUploading(false);
        }
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
        <div className="space-y-6 animate-fadeIn max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{t('profile.myProfile')}</h1>
                <p className="text-zinc-500 text-sm">{t('profile.viewManageInfo')}</p>
            </div>

            {/* Header card */}
            <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    {/* Avatar with upload */}
                    <AvatarEditor
                        profile={profile}
                        onUpload={handleAvatarUpload}
                        onRemove={handleAvatarRemove}
                        uploading={avatarUploading}
                    />

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

                        {/* Avatar hint */}
                        <p className="text-zinc-400 text-[11px] mt-2 flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            Click the camera icon on your photo to update it · JPG, PNG, WebP · max 5 MB
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                            >
                                <Edit3 className="w-3.5 h-3.5" /> {t('common.edit')}
                            </button>
                        )}
                        {profile.profile_picture && !avatarUploading && (
                            <button
                                onClick={handleAvatarRemove}
                                title="Remove profile picture"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 rounded-md text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Remove photo
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {editing && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-md">
                    <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-[13px] font-medium text-amber-800">You are editing your profile. Make your changes below and click <strong>Save Changes</strong> when done.</p>
                </div>
            )}

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
                    className="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors"
                />
            ) : (
                <p className="text-[14px] font-semibold text-zinc-900 truncate">{value}</p>
            )}
        </div>
    </div>
);

export default ProfilePage;
