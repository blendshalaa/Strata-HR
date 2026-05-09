import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, Info, CheckCircle2, AlertTriangle, Calendar, Clock, DollarSign } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const typeIcons = {
    leave: Calendar,
    timesheet: Clock,
    payroll: DollarSign,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
};

const typeColors = {
    leave: 'text-sky-600 bg-sky-50',
    timesheet: 'text-zinc-600 bg-zinc-100',
    payroll: 'text-emerald-600 bg-emerald-50',
    success: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    info: 'text-zinc-500 bg-zinc-100',
};

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const { t } = useTranslation();

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            setUnreadCount(res.data.count || 0);
        } catch {
            // Silent fail — bell just won't show count
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications || []);
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        if (!isOpen) fetchNotifications();
        setIsOpen(!isOpen);
    };

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 rounded-[6px] transition-colors"
                style={{ color: '#71717A' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-white border border-zinc-200 rounded-[8px] shadow-lg overflow-hidden z-50 animate-fadeIn">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                        <h3 className="text-[13px] font-bold text-zinc-900">{t('notifications.title')}</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" /> {t('notifications.markAllRead')}
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-5 h-5 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                                <p className="text-[13px] text-zinc-500">{t('notifications.noNotifications')}</p>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const Icon = typeIcons[n.type] || typeIcons.info;
                                const color = typeColors[n.type] || typeColors.info;
                                return (
                                    <div
                                        key={n.id}
                                        className={`px-4 py-3 border-b border-zinc-100 last:border-b-0 flex items-start gap-3 hover:bg-zinc-50 transition-colors ${!n.is_read ? 'bg-zinc-50/50' : ''}`}
                                    >
                                        <div className={`p-1.5 rounded-[6px] shrink-0 mt-0.5 ${color}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[13px] font-semibold ${!n.is_read ? 'text-zinc-900' : 'text-zinc-600'}`}>{n.title}</p>
                                            {n.message && <p className="text-[12px] text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>}
                                            <p className="text-[11px] text-zinc-400 mt-1">{timeAgo(n.created_at)}</p>
                                        </div>
                                        {!n.is_read && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                                                className="p-1 rounded-[4px] hover:bg-zinc-100 shrink-0 transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="w-3.5 h-3.5 text-zinc-400" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
