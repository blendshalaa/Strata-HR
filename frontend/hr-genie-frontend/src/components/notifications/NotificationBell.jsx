import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, Calendar, Clock, DollarSign, Target, Layers, FileText, Users } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const typeIcons = {
    leave: Calendar,
    timesheet: Clock,
    payroll: DollarSign,
    shift: Layers,
    goal: Target,
    document: FileText,
    user: Users,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
};

const typeColors = {
    leave: 'text-sky-600 bg-sky-50 border-sky-100',
    timesheet: 'text-zinc-600 bg-zinc-100 border-zinc-200',
    payroll: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    shift: 'text-violet-600 bg-violet-50 border-violet-100',
    goal: 'text-amber-600 bg-amber-50 border-amber-100',
    document: 'text-zinc-600 bg-zinc-50 border-zinc-200',
    user: 'text-zinc-900 bg-zinc-100 border-zinc-200',
    success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    warning: 'text-amber-600 bg-amber-50 border-amber-100',
    info: 'text-zinc-500 bg-zinc-100 border-zinc-200',
};

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [justReceived, setJustReceived] = useState(false);
    const dropdownRef = useRef(null);
    const { t } = useTranslation();
    const { socket } = useSocket();
    const navigate = useNavigate();

    // ── Fetch unread count on mount (REST fallback) ─────────────────
    useEffect(() => {
        fetchUnreadCount();
    }, []);

    // ── Real-time: listen for new notifications via WebSocket ────────
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            setUnreadCount(prev => prev + 1);
            setNotifications(prev => [notification, ...prev]);

            // Pulse animation on bell
            setJustReceived(true);
            setTimeout(() => setJustReceived(false), 2000);
        };

        socket.on('notification:new', handleNewNotification);
        return () => socket.off('notification:new', handleNewNotification);
    }, [socket]);

    // ── Close on outside click ────────────────────────────────────────
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
            // Silent fail
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

    const handleNotificationClick = (n) => {
        if (!n.is_read) handleMarkRead(n.id);
        if (n.link_url) {
            setIsOpen(false);
            navigate(n.link_url);
        }
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
                onMouseEnter={e => e.currentTarget.style.background = '#F7F7F6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                aria-label="Notifications"
            >
                <Bell
                    className={`w-5 h-5 transition-transform ${justReceived ? 'animate-bounce' : ''}`}
                />
                {unreadCount > 0 && (
                    <span
                        className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-transform ${justReceived ? 'scale-125' : 'scale-100'}`}
                        style={{ backgroundColor: '#EF4444' }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-white rounded-[10px] overflow-hidden z-50 animate-fadeIn"
                    style={{
                    border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    }}
                >
                    {/* Header */}
                    <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}
                    >
                        <div className="flex items-center gap-2">
                            <h3 className="text-[13px] font-bold text-zinc-900">{t('notifications.title')}</h3>
                            {unreadCount > 0 && (
                                <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: '#111318' }}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                {t('notifications.markAllRead')}
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-50">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div style={{ width: '18px', height: '18px', border: '2px solid #E5E7EB', borderTopColor: '#111318', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                                    style={{ backgroundColor: '#F3F4F6' }}
                                >
                                        <Bell className="w-5 h-5" style={{ color: '#111318' }} />
                                </div>
                                <p className="text-[13px] font-medium text-zinc-500">{t('notifications.noNotifications')}</p>
                                <p className="text-[12px] text-zinc-400 mt-0.5">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const Icon = typeIcons[n.type] || typeIcons.info;
                                const colorClass = typeColors[n.type] || typeColors.info;
                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${!n.is_read ? 'bg-zinc-50' : 'bg-white hover:bg-zinc-50'}`}
                                    >
                                        {/* Unread dot */}
                                        {!n.is_read && (
                                            <div
                                                className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                                                style={{ backgroundColor: '#111318' }}
                                            />
                                        )}

                                        <div className={`p-1.5 rounded-[6px] shrink-0 mt-0.5 border ${colorClass}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[13px] font-semibold ${!n.is_read ? 'text-zinc-900' : 'text-zinc-600'}`}>
                                                {n.title}
                                            </p>
                                            {n.message && (
                                                <p className="text-[12px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                                                    {n.message}
                                                </p>
                                            )}
                                            <p className="text-[11px] text-zinc-400 mt-1 font-medium">{timeAgo(n.created_at)}</p>
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

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div
                            className="px-4 py-2.5"
                            style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)' }}
                        >
                            <p className="text-[11px] text-zinc-400 text-center">
                                Showing last {notifications.length} notifications
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
