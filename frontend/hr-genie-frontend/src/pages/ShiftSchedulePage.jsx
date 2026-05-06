import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Users, Trash2, Edit3, Save, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const SHIFT_TYPES = [
    { value: 'morning', label: 'Morning', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { value: 'afternoon', label: 'Afternoon', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'night', label: 'Night', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { value: 'regular', label: 'Regular', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
    { value: 'overtime', label: 'Overtime', color: 'bg-red-100 text-red-800 border-red-200' },
];

const getShiftColor = (type) => SHIFT_TYPES.find(s => s.value === type)?.color || 'bg-zinc-100 text-zinc-800 border-zinc-200';

const ShiftSchedulePage = () => {
    const { isHR, isAdmin } = useAuth();
    const canManage = isHR || isAdmin;
    const toast = useToast();
    const { t } = useTranslation();

    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);

    // Create modal
    const [showCreate, setShowCreate] = useState(false);
    const [createDate, setCreateDate] = useState('');
    const [createForm, setCreateForm] = useState({ user_id: '', start_time: '09:00', end_time: '17:00', shift_type: 'regular', notes: '' });
    const [createLoading, setCreateLoading] = useState(false);

    // Edit modal
    const [editingShift, setEditingShift] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    // Delete confirm
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [copyLoading, setCopyLoading] = useState(false);

    // Week calculation
    const weekDays = useMemo(() => {
        const now = new Date();
        const day = now.getDay() || 7;
        const mon = new Date(now);
        mon.setDate(now.getDate() - day + 1 + (weekOffset * 7));
        mon.setHours(0, 0, 0, 0);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(mon);
            d.setDate(mon.getDate() + i);
            days.push({
                date: d,
                dateStr: d.toISOString().split('T')[0],
                dayName: d.toLocaleDateString('en', { weekday: 'short' }),
                dayNum: d.getDate(),
                monthName: d.toLocaleDateString('en', { month: 'short' }),
                isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
            });
        }
        return days;
    }, [weekOffset]);

    const weekLabel = `${weekDays[0].monthName} ${weekDays[0].dayNum} – ${weekDays[6].monthName} ${weekDays[6].dayNum}, ${weekDays[6].date.getFullYear()}`;

    useEffect(() => {
        fetchData();
    }, [weekOffset]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const from = weekDays[0].dateStr;
            const to = weekDays[6].dateStr;
            const [shiftsRes, empRes] = await Promise.all([
                api.get('/shifts', { params: { from, to } }),
                canManage ? api.get('/users') : Promise.resolve({ data: [] }),
            ]);
            setShifts(shiftsRes.data.shifts || []);
            if (canManage && empRes.data) {
                setEmployees(Array.isArray(empRes.data) ? empRes.data : empRes.data.users || []);
            }
        } catch (err) {
            toast.error(t('shifts.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    // Group shifts by employee
    const employeeShifts = useMemo(() => {
        const map = {};
        shifts.forEach(s => {
            if (!map[s.user_id]) {
                map[s.user_id] = { name: s.employee_name, department: s.department, shifts: {} };
            }
            const dateKey = new Date(s.shift_date).toISOString().split('T')[0];
            if (!map[s.user_id].shifts[dateKey]) map[s.user_id].shifts[dateKey] = [];
            map[s.user_id].shifts[dateKey].push(s);
        });
        return map;
    }, [shifts]);

    // Compute weekly hours per employee
    const weeklyHours = useMemo(() => {
        const map = {};
        Object.entries(employeeShifts).forEach(([uid, emp]) => {
            let total = 0;
            Object.values(emp.shifts).forEach(dayShifts => {
                dayShifts.forEach(s => {
                    if (s.start_time && s.end_time) {
                        const [sh, sm] = s.start_time.split(':').map(Number);
                        const [eh, em] = s.end_time.split(':').map(Number);
                        total += (eh * 60 + em - (sh * 60 + sm)) / 60;
                    }
                });
            });
            map[uid] = total;
        });
        return map;
    }, [employeeShifts]);

    const employeeIds = Object.keys(employeeShifts);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.user_id) { toast.error('Select an employee'); return; }
        try {
            setCreateLoading(true);
            const res = await api.post('/shifts', { ...createForm, shift_date: createDate });
            setShifts([...shifts, res.data.shift]);
            toast.success(t('shifts.shiftAssigned'));
            setShowCreate(false);
            setCreateForm({ user_id: '', start_time: '09:00', end_time: '17:00', shift_type: 'regular', notes: '' });
        } catch (err) {
            toast.error(err.response?.data?.error || t('shifts.failedToCreate'));
        } finally {
            setCreateLoading(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            setEditLoading(true);
            const res = await api.put(`/shifts/${editingShift.id}`, editForm);
            setShifts(shifts.map(s => s.id === editingShift.id ? { ...s, ...res.data.shift } : s));
            toast.success(t('shifts.shiftUpdated'));
            setEditingShift(null);
        } catch (err) {
            toast.error(err.response?.data?.error || t('shifts.failedToUpdate'));
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/shifts/${id}`);
            setShifts(shifts.filter(s => s.id !== id));
            toast.success(t('shifts.shiftRemoved'));
        } catch (err) {
            toast.error(t('shifts.failedToDelete'));
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleCopyLastWeek = async () => {
        if (weekOffset !== 0) {
            toast.error('Can only copy to current week');
            return;
        }
        setCopyLoading(true);
        try {
            // Fetch last week's shifts
            const lastWeekFrom = new Date(weekDays[0].date);
            lastWeekFrom.setDate(lastWeekFrom.getDate() - 7);
            const lastWeekTo = new Date(weekDays[6].date);
            lastWeekTo.setDate(lastWeekTo.getDate() - 7);
            const res = await api.get('/shifts', {
                params: {
                    from: lastWeekFrom.toISOString().split('T')[0],
                    to: lastWeekTo.toISOString().split('T')[0]
                }
            });
            const lastWeekShifts = res.data.shifts || [];
            if (!lastWeekShifts.length) {
                toast.error('No shifts found last week to copy');
                return;
            }
            // Re-create each shift 7 days forward
            const created = await Promise.all(
                lastWeekShifts.map(s => {
                    const newDate = new Date(s.shift_date);
                    newDate.setDate(newDate.getDate() + 7);
                    return api.post('/shifts', {
                        user_id: s.user_id,
                        shift_date: newDate.toISOString().split('T')[0],
                        start_time: s.start_time,
                        end_time: s.end_time,
                        shift_type: s.shift_type,
                        notes: s.notes || ''
                    });
                })
            );
            const newShifts = created.map(r => r.data.shift).filter(Boolean);
            setShifts(prev => [...prev, ...newShifts]);
            toast.success(`${newShifts.length} shifts copied from last week`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to copy shifts');
        } finally {
            setCopyLoading(false);
        }
    };

    const openCreateForDate = (dateStr) => {
        setCreateDate(dateStr);
        setShowCreate(true);
    };

    const openEdit = (shift) => {
        setEditForm({
            start_time: shift.start_time?.slice(0, 5),
            end_time: shift.end_time?.slice(0, 5),
            shift_type: shift.shift_type,
            notes: shift.notes || '',
        });
        setEditingShift(shift);
    };

    const formatTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${h12}:${m} ${ampm}`;
    };

    const inputClass = "w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors";

    if (loading && shifts.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{t('shifts.title')}</h1>
                    <p className="text-zinc-500 text-sm">
                        {canManage ? t('shifts.subtitleManager') : t('shifts.subtitleEmployee')}
                    </p>
                </div>
                {/* Shift type legend */}
                <div className="flex items-center gap-2 flex-wrap">
                    {SHIFT_TYPES.map(st => (
                        <span key={st.value} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${st.color}`}>
                            {st.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Week Navigation */}
            <div className="bg-white border border-zinc-200 rounded-md shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                            <ChevronLeft className="w-5 h-5 text-zinc-600" />
                        </button>
                        <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                            <ChevronRight className="w-5 h-5 text-zinc-600" />
                        </button>
                        <h2 className="text-[16px] font-black text-zinc-900 tracking-tight">{weekLabel}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
                            {t('shifts.thisWeek')}
                        </button>
                        {canManage && weekOffset === 0 && (
                            <button
                                onClick={handleCopyLastWeek}
                                disabled={copyLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50"
                            >
                                {copyLoading
                                    ? <div className="w-3 h-3 border border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                                    : <Copy className="w-3 h-3" />}
                                Copy Last Week
                            </button>
                        )}
                    </div>
                </div>

                {/* Schedule Grid */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        {/* Day Headers */}
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400 w-[180px] border-r border-zinc-100">{t('shifts.employee')}</th>
                                {weekDays.map(day => (
                                    <th key={day.dateStr} className={`px-2 py-3 text-center border-r border-zinc-100 last:border-r-0 ${day.isToday ? 'bg-zinc-100' : ''}`}>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{day.dayName}</p>
                                        <p className={`text-[14px] font-black mt-0.5 ${day.isToday ? 'text-zinc-900' : 'text-zinc-600'}`}>{day.dayNum}</p>
                                    </th>
                                ))}
                                <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 w-[60px]">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employeeIds.map(uid => {
                                const emp = employeeShifts[uid];
                                return (
                                    <tr key={uid} className="border-b border-zinc-100 last:border-b-0">
                                        <td className="px-4 py-3 border-r border-zinc-100">
                                            <p className="text-[13px] font-bold text-zinc-900 leading-tight">{emp.name}</p>
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{emp.department}</p>
                                        </td>
                                        {weekDays.map(day => {
                                            const dayShifts = emp.shifts[day.dateStr] || [];
                                            return (
                                                <td key={day.dateStr}
                                                    className={`px-1.5 py-2 border-r border-zinc-100 last:border-r-0 align-top ${day.isToday ? 'bg-zinc-50/50' : ''} ${canManage ? 'cursor-pointer hover:bg-zinc-50' : ''}`}
                                                    onClick={() => canManage && dayShifts.length === 0 && openCreateForDate(day.dateStr)}>
                                                    <div className="space-y-1 min-h-[50px]">
                                                        {dayShifts.map(shift => (
                                                            <div key={shift.id}
                                                                className={`px-2 py-1.5 rounded border text-[11px] font-bold ${getShiftColor(shift.shift_type)} group relative`}
                                                                onClick={e => e.stopPropagation()}>
                                                                <p className="leading-tight">
                                                                    {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                                                                </p>
                                                                {shift.notes && <p className="text-[10px] opacity-70 mt-0.5 truncate">{shift.notes}</p>}
                                                                {canManage && (
                                                                    <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                                                                        <button onClick={() => openEdit(shift)} className="p-0.5 bg-white rounded shadow-sm border border-zinc-200 hover:bg-zinc-50">
                                                                            <Edit3 className="w-2.5 h-2.5 text-zinc-600" />
                                                                        </button>
                                                                        <button onClick={() => setDeleteConfirm(shift.id)} className="p-0.5 bg-white rounded shadow-sm border border-red-200 hover:bg-red-50">
                                                                            <Trash2 className="w-2.5 h-2.5 text-red-500" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {canManage && dayShifts.length === 0 && (
                                                            <div className="h-full min-h-[50px] flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity">
                                                                <Plus className="w-4 h-4 text-zinc-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        {/* Weekly total */}
                                        <td className="px-3 py-2 text-center align-middle">
                                            <span className={`text-[12px] font-black ${
                                                weeklyHours[uid] > 40 ? 'text-red-600' : 'text-zinc-900'
                                            }`}>{weeklyHours[uid]?.toFixed(1) ?? '0.0'}h</span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Quick Add row — always visible for HR */}
                            {canManage && (
                                <tr className="border-t border-zinc-200 bg-zinc-50/50">
                                    <td className="px-4 py-4 border-r border-zinc-100">
                                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                            {employeeIds.length === 0 ? t('shifts.assignAShift') : t('shifts.quickAdd')}
                                        </p>
                                    </td>
                                    {weekDays.map(day => (
                                        <td key={day.dateStr} className="px-1.5 py-2 border-r border-zinc-100 last:border-r-0 text-center">
                                            <button onClick={() => openCreateForDate(day.dateStr)}
                                                className="w-full py-3 hover:bg-zinc-100 rounded-md transition-colors text-zinc-500 hover:text-zinc-700">
                                                <Plus className="w-5 h-5 mx-auto" />
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            )}
                            {/* Empty state for employees (no manage access) */}
                            {!canManage && employeeIds.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-16">
                                        <Clock className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                                        <p className="text-[13px] font-bold text-zinc-900 uppercase tracking-wider">No shifts assigned</p>
                                        <p className="text-[12px] text-zinc-500 mt-1">No shifts assigned to you this week.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Shift Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-zinc-900/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-white border border-zinc-200 rounded-md max-w-md w-full shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
                            <h3 className="text-[16px] font-bold text-zinc-900">{t('shifts.assignShift')}</h3>
                            <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4">
                            <p className="text-[12px] text-zinc-500 font-medium">
                                Date: <span className="text-zinc-900 font-bold">{new Date(createDate + 'T00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                            </p>
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('shifts.employee')}</label>
                                <select value={createForm.user_id} onChange={e => setCreateForm({ ...createForm, user_id: e.target.value })} className={inputClass} required>
                                    <option value="">{t('shifts.selectEmployee')}</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} — {emp.department || t('shifts.noDept')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('shifts.startTime')}</label>
                                    <input type="time" value={createForm.start_time} onChange={e => setCreateForm({ ...createForm, start_time: e.target.value })} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('shifts.endTime')}</label>
                                    <input type="time" value={createForm.end_time} onChange={e => setCreateForm({ ...createForm, end_time: e.target.value })} className={inputClass} required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('shifts.shiftType')}</label>
                                <select value={createForm.shift_type} onChange={e => setCreateForm({ ...createForm, shift_type: e.target.value })} className={inputClass}>
                                    {SHIFT_TYPES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('shifts.notes')}</label>
                                <input type="text" value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} className={inputClass} placeholder={t('shifts.optionalNotes')} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">{t('common.cancel')}</button>
                                <button type="submit" disabled={createLoading} className="px-5 py-2 bg-zinc-900 text-white text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-zinc-800 transition-colors">
                                    {createLoading ? t('shifts.assigning') : t('shifts.assignShift')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Shift Modal */}
            {editingShift && (
                <div className="fixed inset-0 bg-zinc-900/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingShift(null)}>
                    <div className="bg-white border border-zinc-200 rounded-md max-w-md w-full shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
                            <h3 className="text-[16px] font-bold text-zinc-900">{t('shifts.editShift')}</h3>
                            <button onClick={() => setEditingShift(null)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                        <form onSubmit={handleEdit} className="p-5 space-y-4">
                            <p className="text-[12px] text-zinc-500 font-medium">
                                {editingShift.employee_name} — {new Date(editingShift.shift_date).toLocaleDateString()}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('shifts.startTime')}</label>
                                    <input type="time" value={editForm.start_time} onChange={e => setEditForm({ ...editForm, start_time: e.target.value })} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('shifts.endTime')}</label>
                                    <input type="time" value={editForm.end_time} onChange={e => setEditForm({ ...editForm, end_time: e.target.value })} className={inputClass} required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('shifts.shiftType')}</label>
                                <select value={editForm.shift_type} onChange={e => setEditForm({ ...editForm, shift_type: e.target.value })} className={inputClass}>
                                    {SHIFT_TYPES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{t('shifts.notes')}</label>
                                <input type="text" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className={inputClass} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setEditingShift(null)} className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">{t('common.cancel')}</button>
                                <button type="submit" disabled={editLoading} className="px-5 py-2 bg-zinc-900 text-white text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-2">
                                    <Save className="w-3.5 h-3.5" /> {editLoading ? t('shifts.saving') : t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => handleDelete(deleteConfirm)}
                title={t('common.confirmDeleteTitle')}
                message={t('shifts.removeShiftConfirm')}
                confirmLabel={t('common.delete')}
            />
        </div>
    );
};

export default ShiftSchedulePage;
