import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, XCircle, Calendar, Timer, AlertCircle, Plus, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import TimeClockWidget from '../components/dashboard/TimeClockWidget';
import useIsMobile from '../hooks/useIsMobile';

const TABS = [
    { key: 'list', labelKey: 'timesheets.allEntries' },
    { key: 'weekly', labelKey: 'timesheets.weeklyView' },
];

const MyTimesheetsPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('list');
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualForm, setManualForm] = useState({ clock_in: '', clock_out: '', notes: '' });
    const [manualLoading, setManualLoading] = useState(false);
    const isMobile = useIsMobile();

    // Date filter
    const [filterRange, setFilterRange] = useState('this-week');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    // Weekly view navigation
    const [weekOffset, setWeekOffset] = useState(0);

    useEffect(() => {
        fetchTimesheets();
    }, [filterRange, customFrom, customTo]);

    const getDateRange = () => {
        const now = new Date();
        switch (filterRange) {
            case 'this-week': {
                const day = now.getDay() || 7;
                const mon = new Date(now);
                mon.setDate(now.getDate() - day + 1);
                mon.setHours(0, 0, 0, 0);
                const sun = new Date(mon);
                sun.setDate(mon.getDate() + 6);
                return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0] };
            }
            case 'last-week': {
                const day = now.getDay() || 7;
                const mon = new Date(now);
                mon.setDate(now.getDate() - day - 6);
                mon.setHours(0, 0, 0, 0);
                const sun = new Date(mon);
                sun.setDate(mon.getDate() + 6);
                return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0] };
            }
            case 'this-month': {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
            }
            case 'custom':
                return { from: customFrom || undefined, to: customTo || undefined };
            case 'all':
            default:
                return {};
        }
    };

    const fetchTimesheets = async () => {
        try {
            setLoading(true);
            const range = getDateRange();
            const params = {};
            if (range.from) params.from = range.from;
            if (range.to) params.to = range.to;
            const res = await api.get('/attendance/me', { params });
            setTimesheets(res.data.timesheets || []);
        } catch (err) {
            toast.error(t('timesheets.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualForm.clock_in || !manualForm.clock_out) {
            toast.error(t('timesheets.clockInOutRequired'));
            return;
        }
        try {
            setManualLoading(true);
            await api.post('/attendance/manual', manualForm);
            toast.success(t('timesheets.manualSubmitted'));
            setShowManualEntry(false);
            setManualForm({ clock_in: '', clock_out: '', notes: '' });
            fetchTimesheets();
        } catch (err) {
            toast.error(err.response?.data?.error || t('timesheets.failedToSubmit'));
        } finally {
            setManualLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            approved: { icon: CheckCircle2, label: 'Approved', classes: 'bg-green-50 text-green-700 border-green-100' },
            rejected: { icon: XCircle, label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-100' },
            processed: { icon: Timer, label: 'Processed', classes: 'bg-[#EEF0FF] text-[#5B4FE8] border-blue-100' },
            pending: { icon: Clock, label: 'Pending', classes: 'bg-zinc-100 text-zinc-900 border-zinc-200' },
        };
        return configs[status] || configs.pending;
    };

    // P1: Weekly summary data
    const weeklyData = useMemo(() => {
        const now = new Date();
        const day = now.getDay() || 7;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - day + 1 + (weekOffset * 7));
        weekStart.setHours(0, 0, 0, 0);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const dayTimesheets = timesheets.filter(ts => {
                const tsDate = new Date(ts.clock_in).toISOString().split('T')[0];
                return tsDate === dateStr;
            });
            const totalRegular = dayTimesheets.reduce((s, t) => s + parseFloat(t.regular_hours || 0), 0);
            const totalOvertime = dayTimesheets.reduce((s, t) => s + parseFloat(t.overtime_hours || 0), 0);
            days.push({
                date: d,
                dateStr,
                dayName: d.toLocaleDateString('en', { weekday: 'short' }),
                dayNum: d.getDate(),
                monthName: d.toLocaleDateString('en', { month: 'short' }),
                timesheets: dayTimesheets,
                regular: totalRegular,
                overtime: totalOvertime,
                total: totalRegular + totalOvertime,
                isToday: dateStr === new Date().toISOString().split('T')[0],
            });
        }

        const weekTotal = days.reduce((s, d) => s + d.total, 0);
        const weekRegular = days.reduce((s, d) => s + d.regular, 0);
        const weekOvertime = days.reduce((s, d) => s + d.overtime, 0);
        const weekLabel = `${days[0].monthName} ${days[0].dayNum} – ${days[6].monthName} ${days[6].dayNum}`;

        return { days, weekTotal, weekRegular, weekOvertime, weekLabel };
    }, [timesheets, weekOffset]);

    // Summary stats
    const totalHours = timesheets.reduce((sum, t) => sum + parseFloat(t.regular_hours || 0) + parseFloat(t.overtime_hours || 0), 0);
    const pendingCount = timesheets.filter(t => t.status === 'pending').length;
    const approvedCount = timesheets.filter(t => t.status === 'approved').length;

    const inputClass = "w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors placeholder-zinc-400";

    if (loading && timesheets.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{t('timesheets.title')}</h1>
                    <p className="text-zinc-500 text-sm">{t('timesheets.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className="px-4 py-2 bg-[#5B4FE8] text-white text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-[#4a3fd4] transition-colors flex items-center gap-2"
                    title="Add a timesheet entry manually if you forgot to clock in or out"
                >
                    <Plus className="w-3.5 h-3.5" />
                    {t('timesheets.manualEntry')}
                </button>
            </div>

            {/* Compact Clock-in/out Widget */}
            <TimeClockWidget compact />

            {/* Manual Entry Form */}
            {showManualEntry && (
                <div className="bg-white border border-zinc-200 rounded-md p-6 animate-fadeIn">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[15px] font-bold text-zinc-900">{t('timesheets.submitManualEntry')}</h3>
                        <button onClick={() => setShowManualEntry(false)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('timesheets.clockIn')}</label>
                                <input type="datetime-local" value={manualForm.clock_in} onChange={e => setManualForm({ ...manualForm, clock_in: e.target.value })} className={inputClass} required />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('timesheets.clockOut')}</label>
                                <input type="datetime-local" value={manualForm.clock_out} onChange={e => setManualForm({ ...manualForm, clock_out: e.target.value })} className={inputClass} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('timesheets.noteReason')}</label>
                            <input type="text" value={manualForm.notes} onChange={e => setManualForm({ ...manualForm, notes: e.target.value })} className={inputClass} placeholder="e.g. Forgot to clock out yesterday" />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowManualEntry(false)} className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">{t('common.cancel')}</button>
                            <button type="submit" disabled={manualLoading} className="px-5 py-2 bg-[#5B4FE8] text-white text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-[#4a3fd4] transition-colors">
                                {manualLoading ? t('common.submitting') : t('common.submit')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-zinc-200 rounded-md p-5">
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">{t('timesheets.totalHours')}</p>
                    <p className="text-2xl font-black text-zinc-900">{totalHours.toFixed(1)}<span className="text-[12px] text-zinc-400 font-bold ml-1.5 uppercase">{t('timesheets.hrs')}</span></p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-md p-5">
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">{t('common.pending')}</p>
                    <p className="text-2xl font-black text-zinc-900">{pendingCount}</p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-md p-5">
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">{t('common.approved')}</p>
                    <p className="text-2xl font-black text-zinc-900">{approvedCount}</p>
                </div>
            </div>

            {/* Filters + Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-1 bg-zinc-100 p-1 rounded-md border border-zinc-200">
                    {TABS.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-md text-[13px] font-bold transition-all ${activeTab === tab.key ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700 border border-transparent'}`}>
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <select value={filterRange} onChange={e => setFilterRange(e.target.value)}
                        className="px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] font-bold text-zinc-900 focus:outline-none focus:border-[#5B4FE8]">
                        <option value="all">{t('timesheets.allTime')}</option>
                        <option value="this-week">{t('timesheets.thisWeek')}</option>
                        <option value="last-week">{t('timesheets.lastWeek')}</option>
                        <option value="this-month">{t('timesheets.thisMonth')}</option>
                        <option value="custom">{t('timesheets.customRange')}</option>
                    </select>
                    {filterRange === 'custom' && (
                        <>
                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8]" />
                            <span className="text-zinc-400 text-[12px] font-bold">to</span>
                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8]" />
                        </>
                    )}
                </div>
            </div>

            {/* List View */}
            {activeTab === 'list' && (
                <>
                    {timesheets.length === 0 ? (
                        <div className="bg-white border border-zinc-200 rounded-md h-48 flex flex-col items-center justify-center text-center px-6">
                            <Clock className="w-10 h-10 text-zinc-200 mb-3" />
                            <p className="text-[13px] font-bold text-zinc-900 uppercase tracking-wider">{t('timesheets.noTimesheets')}</p>
                            <p className="text-[12px] text-zinc-500 mt-1">{t('timesheets.tryChangingRange')}</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
                            {isMobile ? (
                                <div className="divide-y divide-zinc-100">
                                    {timesheets.map(ts => {
                                        const cfg = getStatusConfig(ts.status);
                                        const StatusIcon = cfg.icon;
                                        return (
                                            <div key={ts.id} className="p-4 bg-white hover:bg-zinc-50/50 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-zinc-900 font-bold text-[13px]">{new Date(ts.clock_in).toLocaleDateString()}</span>
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cfg.classes}`}>
                                                        <StatusIcon className="w-3 h-3" />{cfg.label}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[13px] mb-2">
                                                    <span className="text-zinc-500 font-medium">
                                                        {new Date(ts.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {' — '}
                                                        {ts.clock_out
                                                            ? new Date(ts.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : <span className="text-amber-600 font-bold text-[11px] uppercase tracking-wider">{t('timesheets.inProgress')}</span>
                                                        }
                                                    </span>
                                                    <span className="text-zinc-900 font-black">{parseFloat(ts.regular_hours || 0).toFixed(1)}h</span>
                                                </div>
                                                {parseFloat(ts.overtime_hours) > 0 && (
                                                    <div className="flex justify-between text-[12px] font-bold text-red-600 mb-1">
                                                        <span>Overtime:</span>
                                                        <span>+{parseFloat(ts.overtime_hours).toFixed(1)}h</span>
                                                    </div>
                                                )}
                                                {ts.notes && (
                                                    <div className="text-[12px] text-zinc-500 bg-zinc-50 p-2 rounded border border-zinc-100 mt-2">
                                                        <FileText className="w-3 h-3 inline mr-1 text-zinc-400" />{ts.notes}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('timesheets.date')}</th>
                                        <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('timesheets.clockIn')}</th>
                                        <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('timesheets.clockOut')}</th>
                                        <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest text-right">{t('timesheets.regular')}</th>
                                        <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest text-right">{t('timesheets.overtime')}</th>
                                        <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('timesheets.notes')}</th>
                                        <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest text-right">{t('common.status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {timesheets.map(ts => {
                                        const cfg = getStatusConfig(ts.status);
                                        const StatusIcon = cfg.icon;
                                        return (
                                            <tr key={ts.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-zinc-900 font-bold text-[13px]">{new Date(ts.clock_in).toLocaleDateString()}</span>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-500 font-medium text-[13px]">
                                                    {new Date(ts.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-500 font-medium text-[13px]">
                                                    {ts.clock_out
                                                        ? new Date(ts.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : <span className="text-amber-600 font-bold text-[11px] uppercase tracking-wider">{t('timesheets.inProgress')}</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-right text-zinc-900 font-black text-[13px]">{parseFloat(ts.regular_hours || 0).toFixed(1)}h</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`text-[13px] font-black ${parseFloat(ts.overtime_hours) > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                                                        {parseFloat(ts.overtime_hours || 0).toFixed(1)}h
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-[150px]">
                                                    {ts.notes ? (
                                                        <span className="text-[12px] text-zinc-500 truncate block" title={ts.notes}>
                                                            <FileText className="w-3 h-3 inline mr-1 text-zinc-400" />{ts.notes}
                                                        </span>
                                                    ) : <span className="text-zinc-400 text-[11px]">—</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cfg.classes}`}>
                                                        <StatusIcon className="w-3 h-3" />{cfg.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Weekly View */}
            {activeTab === 'weekly' && (
                <div className="space-y-4">
                    {/* Week Navigation */}
                    <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-md px-5 py-3">
                        <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                            <ChevronLeft className="w-5 h-5 text-zinc-600" />
                        </button>
                        <div className="text-center">
                            <h3 className="text-[15px] font-black text-zinc-900">{weeklyData.weekLabel}</h3>
                            <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                                {weeklyData.weekTotal.toFixed(1)}h total · {weeklyData.weekRegular.toFixed(1)}h regular · {weeklyData.weekOvertime.toFixed(1)}h overtime
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
                                {t('timesheets.thisWeek')}
                            </button>
                            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                                <ChevronRight className="w-5 h-5 text-zinc-600" />
                            </button>
                        </div>
                    </div>

                    {/* Day Cards */}
                    <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-7'}`}>
                        {weeklyData.days.map(day => (
                            <div key={day.dateStr} className={`bg-white border rounded-md p-4 transition-colors ${isMobile ? 'flex items-center justify-between text-left' : 'text-center'} ${day.isToday ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'}`}>
                                {isMobile ? (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">{day.dayName}</p>
                                                <p className={`text-[15px] font-black leading-none ${day.isToday ? 'text-zinc-900' : 'text-zinc-600'}`}>{day.dayNum}</p>
                                            </div>
                                            {day.total > 0 ? (
                                                <div>
                                                    <p className="text-[13px] font-bold text-zinc-900">{day.total.toFixed(1)} {t('timesheets.hours')}</p>
                                                    {day.overtime > 0 && <p className="text-[11px] font-bold text-red-600">+{day.overtime.toFixed(1)}h OT</p>}
                                                </div>
                                            ) : (
                                                <p className="text-[12px] text-zinc-400 font-bold">—</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{day.dayName}</p>
                                <p className={`text-[14px] font-black mb-3 ${day.isToday ? 'text-zinc-900' : 'text-zinc-600'}`}>{day.dayNum}</p>
                                        {day.total > 0 ? (
                                            <>
                                                <p className="text-[20px] font-black text-zinc-900 leading-none">{day.total.toFixed(1)}</p>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">{t('timesheets.hours')}</p>
                                                {day.overtime > 0 && (
                                                    <p className="text-[10px] font-bold text-red-600 mt-1">+{day.overtime.toFixed(1)}h OT</p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-[11px] text-zinc-400 font-bold mt-2">—</p>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Weekly Total Bar */}
                    <div className="bg-white border border-zinc-200 rounded-md p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{t('timesheets.weeklyProgress')}</span>
                            <span className="text-[13px] font-black text-zinc-900">{weeklyData.weekTotal.toFixed(1)} / 40h</span>
                        </div>
                        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#5B4FE8] rounded-full transition-all duration-500" style={{ width: `${Math.min((weeklyData.weekTotal / 40) * 100, 100)}%` }} />
                        </div>
                        {weeklyData.weekOvertime > 0 && (
                            <p className="text-[11px] font-bold text-red-600 mt-2">{t('timesheets.overtimeThisWeek', { hours: weeklyData.weekOvertime.toFixed(1) })}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTimesheetsPage;
