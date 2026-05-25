import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Shield, Search, Filter, ChevronLeft, ChevronRight,
    UserCog, FileCheck, DollarSign, Calendar, Clock,
    Trash2, Plus, RefreshCw, Download, CheckCircle2,
    XCircle, Edit3, LogIn, Eye, AlertTriangle, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// ── Config ────────────────────────────────────────────────────────
const ACTION_CONFIG = {
    create:  { label: 'Created',  icon: Plus,         color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    update:  { label: 'Updated',  icon: Edit3,        color: 'text-blue-700 bg-blue-50 border-blue-200' },
    delete:  { label: 'Deleted',  icon: Trash2,       color: 'text-red-700 bg-red-50 border-red-200' },
    approve: { label: 'Approved', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    reject:  { label: 'Rejected', icon: XCircle,      color: 'text-red-700 bg-red-50 border-red-200' },
    login:   { label: 'Login',    icon: LogIn,        color: 'text-violet-700 bg-violet-50 border-violet-200' },
    export:  { label: 'Exported', icon: Download,     color: 'text-amber-700 bg-amber-50 border-amber-200' },
    view:    { label: 'Viewed',   icon: Eye,          color: 'text-zinc-600 bg-zinc-100 border-zinc-200' },
};

const ENTITY_CONFIG = {
    leave_request: { label: 'Leave Request', icon: Calendar,    color: 'text-sky-700 bg-sky-50' },
    timesheet:     { label: 'Timesheet',     icon: Clock,       color: 'text-zinc-700 bg-zinc-100' },
    payroll:       { label: 'Payroll',       icon: DollarSign,  color: 'text-emerald-700 bg-emerald-50' },
    user:          { label: 'User',          icon: UserCog,     color: 'text-indigo-700 bg-indigo-50' },
    shift:         { label: 'Shift',         icon: Layers,      color: 'text-violet-700 bg-violet-50' },
    document:      { label: 'Document',      icon: FileCheck,   color: 'text-blue-700 bg-blue-50' },
};

const ACTIONS = ['', 'create', 'update', 'delete', 'approve', 'reject', 'login', 'export'];
const ENTITIES = ['', 'leave_request', 'timesheet', 'payroll', 'user', 'shift', 'document'];
const LIMIT = 25;

// ── Helpers ───────────────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

// ── Main Component ────────────────────────────────────────────────
const AuditLogPage = () => {
    const { isHR, isAdmin } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
    const [expandedId, setExpandedId] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        action: '', entity_type: '', from: '', to: '', actor_id: '',
    });
    const [search, setSearch] = useState('');

    // Guard: non-HR users shouldn't be here
    useEffect(() => {
        if (!isHR) navigate('/dashboard');
    }, [isHR, navigate]);

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: LIMIT, ...filters };
            Object.keys(params).forEach(k => !params[k] && delete params[k]);
            const res = await api.get('/audit', { params });
            setLogs(res.data.logs || []);
            setPagination(res.data.pagination || { page: 1, total: 0, totalPages: 1 });
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await api.get('/audit/stats');
            setStats(res.data);
        } catch { } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => { fetchLogs(1); }, [fetchLogs]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setFilters({ action: '', entity_type: '', from: '', to: '', actor_id: '' });
        setSearch('');
    };

    // Client-side actor name search (filters already fetched rows)
    const displayedLogs = search.trim()
        ? logs.filter(l =>
            l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
            l.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
            l.entity_type?.toLowerCase().includes(search.toLowerCase())
          )
        : logs;

    return (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: '#EEF0FF' }}
                        >
                            <Shield className="w-5 h-5" style={{ color: '#5B4FE8' }} />
                        </div>
                        <h1 className="text-xl font-bold text-zinc-900">{t('auditLog.title')}</h1>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
                            {t('auditLog.adminOnly')}
                        </span>
                    </div>
                    <p className="text-[13px] text-zinc-500 ml-[52px]">
                        {t('auditLog.subtitle')}
                    </p>
                </div>
                <button
                    onClick={() => fetchLogs(pagination.page)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t('auditLog.refresh')}
                </button>
            </div>

            {/* Stats Bar */}
            {!statsLoading && stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label={t('auditLog.eventsToday')} value={stats.today} icon={Shield} color="#5B4FE8" />
                    {stats.actions.slice(0, 3).map(a => (
                        <StatCard
                            key={a.action}
                            label={ACTION_CONFIG[a.action]?.label || a.action}
                            value={a.count}
                            icon={ACTION_CONFIG[a.action]?.icon || Shield}
                            color={a.action === 'delete' || a.action === 'reject' ? '#EF4444' : a.action === 'create' || a.action === 'approve' ? '#10B981' : '#5B4FE8'}
                            sub={t('auditLog.last30Days')}
                        />
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="card">
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                            {t('auditLog.searchActor')}
                        </label>
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder={t('auditLog.searchActor') + '...'}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-[13px] rounded-md border border-zinc-200 focus:outline-none focus:border-[#5B4FE8] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Action filter */}
                    <div className="min-w-[140px]">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                            {t('auditLog.action')}
                        </label>
                        <select
                            value={filters.action}
                            onChange={e => handleFilterChange('action', e.target.value)}
                            className="w-full px-3 py-1.5 text-[13px] rounded-md border border-zinc-200 focus:outline-none focus:border-[#5B4FE8] bg-white transition-colors"
                        >
                            <option value="">{t('auditLog.allActions')}</option>
                            {ACTIONS.filter(Boolean).map(a => (
                                <option key={a} value={a}>{ACTION_CONFIG[a]?.label || a}</option>
                            ))}
                        </select>
                    </div>

                    {/* Entity filter */}
                    <div className="min-w-[160px]">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                            {t('auditLog.resource')}
                        </label>
                        <select
                            value={filters.entity_type}
                            onChange={e => handleFilterChange('entity_type', e.target.value)}
                            className="w-full px-3 py-1.5 text-[13px] rounded-md border border-zinc-200 focus:outline-none focus:border-[#5B4FE8] bg-white transition-colors"
                        >
                            <option value="">{t('auditLog.allResources')}</option>
                            {ENTITIES.filter(Boolean).map(e => (
                                <option key={e} value={e}>{ENTITY_CONFIG[e]?.label || e}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date range */}
                    <div>
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                            {t('auditLog.from')}
                        </label>
                        <input
                            type="date"
                            value={filters.from}
                            onChange={e => handleFilterChange('from', e.target.value)}
                            className="px-3 py-1.5 text-[13px] rounded-md border border-zinc-200 focus:outline-none focus:border-[#5B4FE8] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                            {t('auditLog.to')}
                        </label>
                        <input
                            type="date"
                            value={filters.to}
                            onChange={e => handleFilterChange('to', e.target.value)}
                            className="px-3 py-1.5 text-[13px] rounded-md border border-zinc-200 focus:outline-none focus:border-[#5B4FE8] transition-colors"
                        />
                    </div>

                    <button
                        onClick={handleReset}
                        className="px-3 py-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                    >
                        {t('auditLog.reset')}
                    </button>
                </div>
            </div>

            {/* Log Table */}
            <div className="card !p-0 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin" />
                    </div>
                ) : displayedLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <div className="p-3 rounded-full mb-3" style={{ backgroundColor: '#EEF0FF' }}>
                            <Shield className="w-6 h-6" style={{ color: '#5B4FE8' }} />
                        </div>
                        <p className="text-[14px] font-semibold text-zinc-700">{t('auditLog.noEvents')}</p>
                        <p className="text-[13px] text-zinc-400 mt-1">{t('auditLog.adjustFilters')}</p>
                    </div>
                ) : (
                    <>
                        {/* Table header */}
                        <div
                            className="grid gap-4 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-zinc-400"
                            style={{
                                gridTemplateColumns: '1fr 120px 140px 160px 120px',
                                borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                                backgroundColor: '#FAFAFA',
                            }}
                        >
                            <span>{t('auditLog.actor')}</span>
                            <span>{t('auditLog.action')}</span>
                            <span>{t('auditLog.resource')}</span>
                            <span>{t('auditLog.timestamp')}</span>
                            <span>{t('auditLog.ipAddress')}</span>
                        </div>

                        {/* Rows */}
                        {displayedLogs.map(log => {
                            const action = ACTION_CONFIG[log.action] || { label: log.action, icon: AlertTriangle, color: 'text-zinc-600 bg-zinc-100 border-zinc-200' };
                            const entity = ENTITY_CONFIG[log.entity_type] || { label: log.entity_type, icon: Shield, color: 'text-zinc-600 bg-zinc-100' };
                            const ActionIcon = action.icon;
                            const EntityIcon = entity.icon;
                            const isExpanded = expandedId === log.id;

                            return (
                                <div
                                    key={log.id}
                                    className="border-b border-zinc-50 last:border-b-0"
                                >
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                        className="w-full grid gap-4 px-5 py-3.5 text-left hover:bg-zinc-50/70 transition-colors"
                                        style={{ gridTemplateColumns: '1fr 120px 140px 160px 120px' }}
                                    >
                                        {/* Actor */}
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div
                                                className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                                                style={{ backgroundColor: '#5B4FE8' }}
                                            >
                                                {initials(log.actor_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold text-zinc-900 truncate">{log.actor_name || 'System'}</p>
                                                <p className="text-[11px] text-zinc-400 truncate">{log.actor_email}</p>
                                            </div>
                                        </div>

                                        {/* Action badge */}
                                        <div>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${action.color}`}>
                                                <ActionIcon className="w-3 h-3" />
                                                {action.label}
                                            </span>
                                        </div>

                                        {/* Entity */}
                                        <div className="flex items-center gap-1.5">
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${entity.color}`}>
                                                <EntityIcon className="w-3 h-3" />
                                                {entity.label}
                                            </span>
                                            {log.entity_id && (
                                                <span className="text-[11px] text-zinc-400">#{log.entity_id}</span>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <p className="text-[12px] text-zinc-500 self-center">{fmtDate(log.created_at)}</p>

                                        {/* IP */}
                                        <p className="text-[12px] font-mono text-zinc-400 self-center truncate">{log.ip_address || '—'}</p>
                                    </button>

                                    {/* Expanded diff view */}
                                    {isExpanded && (log.old_value || log.new_value) && (
                                        <div
                                            className="px-5 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
                                            style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }}
                                        >
                                            {log.old_value && (
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">{t('auditLog.before')}</p>
                                                    <pre className="text-[11px] bg-red-50 border border-red-100 rounded-md p-3 overflow-auto max-h-40 text-red-800 leading-relaxed">
                                                        {JSON.stringify(log.old_value, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {log.new_value && (
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">{t('auditLog.after')}</p>
                                                    <pre className="text-[11px] bg-emerald-50 border border-emerald-100 rounded-md p-3 overflow-auto max-h-40 text-emerald-800 leading-relaxed">
                                                        {JSON.stringify(log.new_value, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-[13px] text-zinc-500">
                        {t('auditLog.showingPage')} <span className="font-semibold text-zinc-900">{pagination.page}</span> {t('auditLog.of')}{' '}
                        <span className="font-semibold text-zinc-900">{pagination.totalPages}</span>{' '}
                        <span className="text-zinc-400">({pagination.total} {t('auditLog.total')})</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchLogs(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="p-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-zinc-600" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                                const pg = pagination.page <= 3
                                    ? i + 1
                                    : pagination.page + i - 2;
                                if (pg < 1 || pg > pagination.totalPages) return null;
                                return (
                                    <button
                                        key={pg}
                                        onClick={() => fetchLogs(pg)}
                                        className="w-8 h-8 rounded-md text-[13px] font-semibold transition-colors"
                                        style={{
                                            backgroundColor: pg === pagination.page ? '#5B4FE8' : 'transparent',
                                            color: pg === pagination.page ? '#fff' : '#6B7280',
                                            border: `0.5px solid ${pg === pagination.page ? '#5B4FE8' : '#E5E7EB'}`,
                                        }}
                                    >
                                        {pg}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => fetchLogs(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-zinc-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sub }) => (
    <div className="card !p-4">
        <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold text-zinc-500">{label}</p>
            <div
                className="p-1.5 rounded-md"
                style={{ backgroundColor: `${color}18` }}
            >
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
        </div>
        <p className="text-2xl font-black text-zinc-900">{value?.toLocaleString() ?? '—'}</p>
        {sub && <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>}
    </div>
);

export default AuditLogPage;
