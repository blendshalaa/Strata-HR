import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, User, Calendar, ShieldAlert, Download, Edit3, X, Save, FileText, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

const TimesheetApprovalsPage = () => {
    const { isHR } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const { t } = useTranslation();
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // Filters
    const [filterRange, setFilterRange] = useState('this-week');
    const [filterStatus, setFilterStatus] = useState('');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    // Edit modal
    const [editingTs, setEditingTs] = useState(null);
    const [editForm, setEditForm] = useState({ clock_in: '', clock_out: '', notes: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [approveAllLoading, setApproveAllLoading] = useState(false);

    useEffect(() => {
        if (!isHR) { navigate('/dashboard'); return; }
        fetchTimesheets();
    }, [isHR, navigate, filterRange, filterStatus, customFrom, customTo]);

    const getDateRange = () => {
        const now = new Date();
        switch (filterRange) {
            case 'this-week': {
                const day = now.getDay() || 7;
                const mon = new Date(now); mon.setDate(now.getDate() - day + 1); mon.setHours(0, 0, 0, 0);
                const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0] };
            }
            case 'last-week': {
                const day = now.getDay() || 7;
                const mon = new Date(now); mon.setDate(now.getDate() - day - 6); mon.setHours(0, 0, 0, 0);
                const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0] };
            }
            case 'this-month': {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
            }
            case 'custom':
                return { from: customFrom || undefined, to: customTo || undefined };
            default: return {};
        }
    };

    const fetchTimesheets = async () => {
        try {
            setLoading(true);
            const range = getDateRange();
            const params = {};
            if (range.from) params.from = range.from;
            if (range.to) params.to = range.to;
            if (filterStatus) params.status = filterStatus;
            const res = await api.get('/attendance/approvals', { params });
            setTimesheets(res.data.timesheets || []);
        } catch (err) {
            console.error('Failed to fetch timesheets', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            setActionLoading(id);
            await api.put(`/attendance/${id}/status`, { status });
            setTimesheets(timesheets.map(t => t.id === id ? { ...t, status } : t));
            toast.success(status === 'approved' ? t('timesheetApprovals.timesheetApproved') : t('timesheetApprovals.timesheetRejected'));
        } catch (err) {
            toast.error(t('timesheetApprovals.failedToUpdate'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveAll = async () => {
        const pendingIds = timesheets.filter(t => t.status === 'pending').map(t => t.id);
        if (!pendingIds.length) return;
        setApproveAllLoading(true);
        try {
            await Promise.all(pendingIds.map(id => api.put(`/attendance/${id}/status`, { status: 'approved' })));
            setTimesheets(prev => prev.map(t => pendingIds.includes(t.id) ? { ...t, status: 'approved' } : t));
            toast.success(`${pendingIds.length} timesheets approved`);
        } catch (err) {
            toast.error(t('timesheetApprovals.failedToUpdate'));
        } finally {
            setApproveAllLoading(false);
        }
    };

    const openEdit = (ts) => {
        const ciDate = new Date(ts.clock_in);
        const coDate = ts.clock_out ? new Date(ts.clock_out) : null;
        const formatLocal = (d) => {
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setEditForm({
            clock_in: formatLocal(ciDate),
            clock_out: coDate ? formatLocal(coDate) : '',
            notes: ts.notes || '',
        });
        setEditingTs(ts);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setEditLoading(true);
            const res = await api.put(`/attendance/${editingTs.id}/edit`, editForm);
            setTimesheets(timesheets.map(t => t.id === editingTs.id ? { ...t, ...res.data.timesheet } : t));
            toast.success(t('timesheetApprovals.timesheetCorrected'));
            setEditingTs(null);
        } catch (err) {
            toast.error(err.response?.data?.error || t('timesheetApprovals.failedToEdit'));
        } finally {
            setEditLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            rejected: 'bg-red-50 text-red-700 border-red-200',
            processed: 'bg-zinc-100 text-zinc-500 border-zinc-200',
        };
        const cls = map[status] || 'bg-amber-50 text-amber-700 border-amber-200';
        const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
        return <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${cls}`}>{label}</span>;
    };

    const inputClass = "w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors";

    if (loading && timesheets.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin" />
            </div>
        );
    }

    const pending = timesheets.filter(t => t.status === 'pending');
    const history = timesheets.filter(t => t.status !== 'pending');

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('timesheetApprovals.title')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const res = await api.get('/export/timesheets', { responseType: 'blob' });
                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                const a = document.createElement('a'); a.href = url; a.download = 'timesheets_export.csv'; a.click();
                                window.URL.revokeObjectURL(url);
                                toast.success(t('timesheetApprovals.csvDownloaded'));
                            } catch { toast.error(t('timesheetApprovals.exportFailed')); }
                        }}
                        className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-4 py-2.5 rounded-md hover:bg-zinc-50 font-bold text-sm shadow-sm transition-colors"
                    >
                        <Download className="w-4 h-4" /> {t('timesheetApprovals.exportCsv')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <select value={filterRange} onChange={e => setFilterRange(e.target.value)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] font-bold text-zinc-900 focus:outline-none focus:border-[#5B4FE8]">
                    <option value="all">{t('timesheets.allTime')}</option>
                    <option value="this-week">{t('timesheets.thisWeek')}</option>
                    <option value="last-week">{t('timesheets.lastWeek')}</option>
                    <option value="this-month">{t('timesheets.thisMonth')}</option>
                    <option value="custom">{t('timesheets.customRange')}</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] font-bold text-zinc-900 focus:outline-none focus:border-[#5B4FE8]">
                    <option value="">{t('timesheetApprovals.allStatuses')}</option>
                    <option value="pending">{t('common.pending')}</option>
                    <option value="approved">{t('common.approved')}</option>
                    <option value="rejected">{t('common.rejected')}</option>
                </select>
                {filterRange === 'custom' && (
                    <>
                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8]" />
                        <span className="text-zinc-400 text-[12px] font-bold">to</span>
                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8]" />
                    </>
                )}
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{timesheets.length} entries</span>
            </div>

            {/* Pending Section */}
            {pending.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-md h-48 flex flex-col items-center justify-center">
                    <Clock className="w-10 h-10 mb-3 text-zinc-200" />
                    <p className="text-[14px] font-bold text-zinc-900">{t('timesheetApprovals.allCaughtUp')}</p>
                    <p className="text-sm text-zinc-500">{t('timesheetApprovals.noPendingTimesheets')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Approve-All contextual banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                        <div>
                            <p className="text-[13px] font-bold text-emerald-900">
                                {pending.length} timesheet{pending.length !== 1 ? 's' : ''} waiting for approval
                            </p>
                            <p className="text-[11px] text-emerald-700 mt-0.5">Review individually below, or approve all at once</p>
                        </div>
                        <button
                            onClick={handleApproveAll}
                            disabled={approveAllLoading}
                            className="shrink-0 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 font-bold text-sm transition-colors disabled:opacity-50"
                        >
                            {approveAllLoading
                                ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Approving...</>
                                : <><CheckCheck className="w-4 h-4" /> Approve All ({pending.length})</>
                            }
                        </button>
                    </div>
                    <h2 className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">{t('timesheetApprovals.pendingApproval')} ({pending.length})</h2>
                    {pending.map((shift) => (
                        <div key={shift.id} className="bg-white border border-zinc-200 rounded-md p-5">
                            <div className="flex flex-col md:flex-row gap-5">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-9 h-9 bg-zinc-100 border border-zinc-200 rounded-md flex items-center justify-center">
                                            <User className="w-4 h-4 text-zinc-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-900 text-[14px] leading-none mb-1">{shift.employee_name}</h3>
                                            <p className="text-[10px] text-zinc-500 tracking-wider uppercase font-black">{shift.department}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-zinc-50 rounded-md border border-zinc-100">
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">{t('timesheets.date')}</p>
                                            <p className="text-[13px] font-bold text-zinc-900">{new Date(shift.clock_in).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">{t('timesheets.clockIn')}</p>
                                            <p className="text-[13px] font-bold text-zinc-900">{new Date(shift.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">{t('timesheets.clockOut')}</p>
                                            <p className="text-[13px] font-bold text-zinc-900">{new Date(shift.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">{t('timesheets.regular')}</p>
                                            <p className="text-[13px] font-bold text-zinc-900">{parseFloat(shift.regular_hours).toFixed(1)}h</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">{t('timesheets.overtime')}</p>
                                            <p className={`text-[13px] font-bold ${parseFloat(shift.overtime_hours) > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                                                {parseFloat(shift.overtime_hours).toFixed(1)}h
                                            </p>
                                        </div>
                                    </div>
                                    {shift.notes && (
                                        <p className="mt-3 text-[12px] text-zinc-500 flex items-center gap-1.5">
                                            <FileText className="w-3 h-3 text-zinc-400" /> {shift.notes}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-row md:flex-col gap-2 justify-center md:border-l md:border-zinc-200 md:pl-5 shrink-0">
                                    <button onClick={() => handleStatusChange(shift.id, 'approved')} disabled={actionLoading === shift.id}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors font-bold text-[12px] uppercase tracking-wider">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('timesheetApprovals.approve')}
                                    </button>
                                    <button onClick={() => handleStatusChange(shift.id, 'rejected')} disabled={actionLoading === shift.id}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition-colors font-bold text-[12px] uppercase tracking-wider">
                                        <XCircle className="w-3.5 h-3.5" /> {t('timesheetApprovals.reject')}
                                    </button>
                                    <button onClick={() => openEdit(shift)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-100 transition-colors font-bold text-[12px] uppercase tracking-wider">
                                        <Edit3 className="w-3.5 h-3.5" /> {t('common.edit')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-[12px] font-black text-zinc-400 uppercase tracking-widest mb-4">{t('timesheetApprovals.history')} ({history.length})</h2>
                    <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('common.employee')}</th>
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('timesheets.date')}</th>
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('timesheets.hours')}</th>
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('timesheets.notes')}</th>
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest text-right">{t('common.status')}</th>
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest text-right">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {history.map(shift => (
                                    <tr key={shift.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-900 text-[13px]">{shift.employee_name}</div>
                                            <div className="text-[11px] text-zinc-500">{shift.department}</div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 font-medium text-[13px]">{new Date(shift.clock_in).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-zinc-600 font-medium text-[13px]">{(parseFloat(shift.regular_hours) + parseFloat(shift.overtime_hours)).toFixed(1)}h</td>
                                        <td className="px-6 py-4 max-w-[120px]">
                                            {shift.notes ? <span className="text-[12px] text-zinc-500 truncate block">{shift.notes}</span> : <span className="text-zinc-400 text-[11px]">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">{getStatusBadge(shift.status)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openEdit(shift)} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors">
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingTs && (
                <div className="fixed inset-0 bg-zinc-900/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingTs(null)}>
                    <div className="bg-white border border-zinc-200 rounded-md max-w-md w-full shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
                            <h3 className="text-[16px] font-bold text-zinc-900">{t('timesheetApprovals.editTimesheet')}</h3>
                            <button onClick={() => setEditingTs(null)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                            <p className="text-[12px] text-zinc-500 font-medium">
                                {t('timesheetApprovals.editingTimesheetFor')} <span className="text-zinc-900 font-bold">{editingTs.employee_name}</span>
                            </p>
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('timesheets.clockIn')}</label>
                                <input type="datetime-local" value={editForm.clock_in} onChange={e => setEditForm({ ...editForm, clock_in: e.target.value })} className={inputClass} required />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('timesheets.clockOut')}</label>
                                <input type="datetime-local" value={editForm.clock_out} onChange={e => setEditForm({ ...editForm, clock_out: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('timesheets.notes')}</label>
                                <input type="text" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className={inputClass} placeholder={t('timesheetApprovals.correctionReason')} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setEditingTs(null)} className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={editLoading} className="px-5 py-2 bg-[#5B4FE8] text-white text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-[#4a3fd4] transition-colors flex items-center gap-2">
                                    <Save className="w-3.5 h-3.5" /> {editLoading ? t('common.saving') : t('timesheetApprovals.saveChanges')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimesheetApprovalsPage;
