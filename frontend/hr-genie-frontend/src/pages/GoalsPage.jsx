import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Target, Plus, ChevronDown, ChevronRight, Trash2, Edit3, CheckCircle2, Clock, AlertCircle, X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STATUS_CFG = {
    active: { label: 'Active', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'bg-zinc-50 text-zinc-500 border-zinc-200', icon: X },
    at_risk: { label: 'At Risk', color: 'bg-red-50 text-red-700 border-red-100', icon: AlertCircle },
};

const CATEGORIES = ['individual', 'team', 'company'];

const ProgressBar = ({ value, size = 'md' }) => {
    const h = size === 'sm' ? 'h-1.5' : 'h-2';
    const color = 'bg-zinc-900';
    return (
        <div className={`w-full ${h} bg-zinc-100 rounded-full overflow-hidden`}>
            <div className={`${h} ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
    );
};

const GoalsPage = ({ embedded = false }) => {
    const { user, isHR } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [expandedGoal, setExpandedGoal] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [users, setUsers] = useState([]);

    // Create form
    const [form, setForm] = useState({ title: '', description: '', category: 'individual', target_date: '', user_id: '', key_results: [{ title: '', target_value: 100, unit: '%' }] });

    // Inline KR edit
    const [editingKR, setEditingKR] = useState(null);
    const [krEdit, setKrEdit] = useState({ current_value: 0 });

    // Add KR form
    const [addingKR, setAddingKR] = useState(null);
    const [newKR, setNewKR] = useState({ title: '', target_value: 100, unit: '%' });

    useEffect(() => {
        fetchGoals();
        if (isHR) fetchUsers();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            setGoals(res.data.goals);
        } catch { toast.error(t('goals.failedToLoad')); }
        finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        try { const res = await api.get('/users'); setUsers(res.data.users || []); } catch { }
    };

    const fetchGoalDetail = async (id) => {
        try {
            const res = await api.get(`/goals/${id}`);
            return res.data.goal;
        } catch { return null; }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { toast.error(t('goals.titleRequired')); return; }
        try {
            const payload = { ...form, key_results: form.key_results.filter(kr => kr.title.trim()) };
            await api.post('/goals', payload);
            toast.success(t('goals.goalCreated'));
            setShowCreate(false);
            setForm({ title: '', description: '', category: 'individual', target_date: '', user_id: '', key_results: [{ title: '', target_value: 100, unit: '%' }] });
            fetchGoals();
        } catch (err) { toast.error(err.response?.data?.error || t('goals.failedToCreate')); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('goals.deleteGoalConfirm'))) return;
        try { await api.delete(`/goals/${id}`); toast.success(t('goals.goalDeleted')); fetchGoals(); }
        catch { toast.error(t('goals.deleteFailed')); }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await api.put(`/goals/${id}`, { status });
            fetchGoals();
            if (expandedGoal?.id === id) {
                setExpandedGoal(prev => ({ ...prev, status }));
            }
        } catch { toast.error(t('goals.updateFailed')); }
    };

    const toggleExpand = async (goal) => {
        if (expandedGoal?.id === goal.id) { setExpandedGoal(null); return; }
        const detail = await fetchGoalDetail(goal.id);
        if (detail) setExpandedGoal(detail);
    };

    const handleUpdateKR = async (krId) => {
        try {
            const res = await api.put(`/goals/key-results/${krId}`, krEdit);
            toast.success(t('goals.progressUpdated'));
            setEditingKR(null);
            const detail = await fetchGoalDetail(expandedGoal.id);
            if (detail) setExpandedGoal(detail);
            fetchGoals();
        } catch { toast.error(t('goals.updateFailed')); }
    };

    const handleAddKR = async (goalId) => {
        if (!newKR.title.trim()) { toast.error('Title required'); return; }
        try {
            await api.post(`/goals/${goalId}/key-results`, newKR);
            toast.success(t('goals.keyResultAdded'));
            setAddingKR(null);
            setNewKR({ title: '', target_value: 100, unit: '%' });
            const detail = await fetchGoalDetail(goalId);
            if (detail) setExpandedGoal(detail);
            fetchGoals();
        } catch { toast.error(t('goals.failedToAddKr')); }
    };

    const handleDeleteKR = async (krId) => {
        try {
            await api.delete(`/goals/key-results/${krId}`);
            toast.success(t('goals.keyResultDeleted'));
            const detail = await fetchGoalDetail(expandedGoal.id);
            if (detail) setExpandedGoal(detail);
            fetchGoals();
        } catch { toast.error(t('goals.deleteFailed')); }
    };

    const addKRField = () => {
        setForm(f => ({ ...f, key_results: [...f.key_results, { title: '', target_value: 100, unit: '%' }] }));
    };
    const updateKRField = (i, field, val) => {
        setForm(f => {
            const krs = [...f.key_results];
            krs[i] = { ...krs[i], [field]: val };
            return { ...f, key_results: krs };
        });
    };
    const removeKRField = (i) => {
        setForm(f => ({ ...f, key_results: f.key_results.filter((_, idx) => idx !== i) }));
    };

    const filtered = goals.filter(g => !filterStatus || g.status === filterStatus);
    const inputClass = "w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors placeholder-zinc-400";

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            {!embedded && (
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1 flex items-center gap-2">
                        {t('goals.title')}
                    </h1>
                    <p className="text-zinc-500 text-sm">{t('goals.subtitle')}</p>
                </div>
                <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-zinc-900 text-white text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" /> {t('goals.newGoal')}
                </button>
            </div>
            )}
            {embedded && (
            <div className="flex justify-end">
                <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-zinc-900 text-white text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" /> {t('goals.newGoal')}
                </button>
            </div>
            )}

            {/* Create Form */}
            {showCreate && (
                <div className="bg-white border border-zinc-200 rounded-lg p-6 animate-fadeIn shadow-sm">
                    <h3 className="text-[16px] font-bold text-zinc-900 mb-6 border-b border-zinc-50 pb-4">{t('goals.createNewGoal')}</h3>
                    <form onSubmit={handleCreate} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[13px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">{t('goals.goalTitle')}</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    className={inputClass} placeholder="e.g., Increase customer satisfaction score" required />
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">{t('goals.category')}</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
                                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">{t('goals.targetDate')}</label>
                                <input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} className={inputClass} />
                            </div>
                            {isHR && (
                                <div>
                                    <label className="block text-[13px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">{t('goals.assignTo')}</label>
                                    <select value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} className={inputClass}>
                                        <option value="">{t('goals.myself')}</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">{t('goals.description')}</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                className={`${inputClass} h-24 resize-none leading-relaxed`} placeholder="Describe the objective and desired outcome..." />
                        </div>

                        {/* Key Results */}
                        <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-5">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-[12px] font-black text-zinc-900 uppercase tracking-widest">{t('goals.keyResults')}</label>
                                <button type="button" onClick={addKRField} className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1 uppercase tracking-wider transition-colors">
                                    <Plus className="w-3 h-3" /> {t('goals.addKr')}
                                </button>
                            </div>
                            <div className="space-y-3">
                                {form.key_results.map((kr, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <input type="text" value={kr.title} onChange={e => updateKRField(i, 'title', e.target.value)}
                                            className={`${inputClass} flex-1`} placeholder={`Key result ${i + 1}`} />
                                        <input type="number" value={kr.target_value} onChange={e => updateKRField(i, 'target_value', e.target.value)}
                                            className={`${inputClass} w-24`} placeholder="Target" />
                                        <input type="text" value={kr.unit} onChange={e => updateKRField(i, 'unit', e.target.value)}
                                            className={`${inputClass} w-20`} placeholder="Unit" />
                                        {form.key_results.length > 1 && (
                                            <button type="button" onClick={() => removeKRField(i)} className="text-zinc-400 hover:text-red-600 p-1.5 transition-colors"><X className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-50">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-white text-zinc-700 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors text-[12px] font-bold uppercase tracking-wider">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors text-[12px] font-bold uppercase tracking-wider">{t('goals.createGoal')}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-4">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-zinc-900 text-[13px] font-bold focus:outline-none focus:border-zinc-900 transition-colors">
                    <option value="">{t('goals.allStatuses')}</option>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">{filtered.length} goal{filtered.length !== 1 ? 's' : ''} total</span>
            </div>

            {/* Goals List */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-lg p-16 text-center shadow-sm">
                    <Target className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-[14px] font-bold text-zinc-900 uppercase tracking-wider">{t('goals.noGoals')}</p>
                    <p className="text-zinc-500 text-[12px] mt-1">{t('goals.defineObjectives')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(goal => {
                        const st = STATUS_CFG[goal.status] || STATUS_CFG.active;
                        const StIcon = st.icon;
                        const isExpanded = expandedGoal?.id === goal.id;
                        return (
                            <div key={goal.id} className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:border-zinc-300 transition-colors">
                                {/* Goal Header */}
                                <div className="p-5 cursor-pointer" onClick={() => toggleExpand(goal)}>
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className={`p-2 rounded-md ${isExpanded ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'} transition-colors`}>
                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <h3 className="text-[15px] font-bold text-zinc-900 tracking-tight">{goal.title}</h3>
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${st.color}`}>
                                                        <StIcon className="w-3 h-3" /> {st.label}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-50 border border-zinc-200 text-zinc-500">{goal.category}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                                    {isHR && goal.owner_name && <span className="flex items-center gap-1.5"><Save className="w-3 h-3" /> {goal.owner_name}</span>}
                                                    {goal.target_date && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(goal.target_date).toLocaleDateString()}</span>}
                                                    <span className="flex items-center gap-1.5"><Target className="w-3 h-3" /> {goal.kr_count || 0} {t('goals.krs')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5 shrink-0" onClick={e => e.stopPropagation()}>
                                            <div className="text-right">
                                                <p className="text-[18px] font-black text-zinc-900 leading-none">{goal.progress}%</p>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{t('goals.complete')}</p>
                                            </div>
                                            <div className="w-24">
                                                <ProgressBar value={goal.progress} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select value={goal.status} onChange={e => handleStatusChange(goal.id, e.target.value)}
                                                    className="px-2 py-1 bg-white border border-zinc-200 rounded-md text-zinc-700 text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:border-zinc-900">
                                                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                                </select>
                                                <button onClick={() => handleDelete(goal.id)} className="p-1.5 text-zinc-400 hover:text-red-600 border border-transparent hover:border-red-100 hover:bg-red-50 rounded-md transition-all">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded: Key Results */}
                                {isExpanded && expandedGoal && (
                                    <div className="border-t border-zinc-100 bg-zinc-50/30 px-6 py-6 space-y-5 animate-fadeIn">
                                        {expandedGoal.description && (
                                            <div className="bg-white border border-zinc-100 rounded-md p-4">
                                                <p className="text-[13px] text-zinc-600 leading-relaxed italic">"{expandedGoal.description}"</p>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[12px] font-black text-zinc-900 uppercase tracking-widest">{t('goals.keyResultsDetails')}</h4>
                                            <button onClick={() => { setAddingKR(expandedGoal.id); setNewKR({ title: '', target_value: 100, unit: '%' }); }}
                                                className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1 uppercase tracking-wider transition-colors">
                                                <Plus className="w-3.5 h-3.5" /> {t('goals.addNewKr')}
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {(expandedGoal.key_results || []).length === 0 && (
                                                <p className="text-[13px] text-zinc-400 italic text-center py-4 bg-white border border-dashed border-zinc-200 rounded-md">{t('goals.noKeyResults')}</p>
                                            )}

                                            {(expandedGoal.key_results || []).map(kr => {
                                                const pct = kr.target_value > 0 ? Math.min(Math.round((kr.current_value / kr.target_value) * 100), 100) : 0;
                                                return (
                                                    <div key={kr.id} className="bg-white border border-zinc-200 rounded-md p-4 shadow-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <p className="text-[13px] font-bold text-zinc-900">{kr.title}</p>
                                                            <div className="flex items-center gap-3">
                                                                {editingKR === kr.id ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <input type="number" value={krEdit.current_value}
                                                                            onChange={e => setKrEdit({ ...krEdit, current_value: parseFloat(e.target.value) })}
                                                                            className="w-20 px-2 py-1 bg-white border border-zinc-900 rounded text-zinc-900 text-[12px] font-bold outline-none" />
                                                                        <span className="text-[11px] font-bold text-zinc-400 uppercase">/ {kr.target_value} {kr.unit}</span>
                                                                        <button onClick={() => handleUpdateKR(kr.id)} className="p-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors"><Save className="w-3.5 h-3.5" /></button>
                                                                        <button onClick={() => setEditingKR(null)} className="p-1.5 bg-zinc-100 text-zinc-400 rounded-md hover:bg-zinc-200 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-[11px] font-bold text-zinc-400 uppercase">{kr.current_value} / {kr.target_value} {kr.unit}</span>
                                                                        <span className="text-[13px] font-black text-zinc-900">{pct}%</span>
                                                                        <div className="flex items-center border-l border-zinc-100 pl-3 ml-2 gap-1">
                                                                            <button onClick={() => { setEditingKR(kr.id); setKrEdit({ current_value: kr.current_value }); }}
                                                                                className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                                                            <button onClick={() => handleDeleteKR(kr.id)}
                                                                                className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ProgressBar value={pct} size="sm" />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Add KR inline */}
                                        {addingKR === expandedGoal.id && (
                                            <div className="flex items-center gap-3 mt-6 p-5 bg-zinc-100 rounded-md border border-zinc-200 animate-slideUp">
                                                <input type="text" value={newKR.title} onChange={e => setNewKR({ ...newKR, title: e.target.value })}
                                                    className={`${inputClass} flex-1`} placeholder="Key result title" />
                                                <input type="number" value={newKR.target_value} onChange={e => setNewKR({ ...newKR, target_value: e.target.value })}
                                                    className={`${inputClass} w-24`} placeholder="Target" />
                                                <input type="text" value={newKR.unit} onChange={e => setNewKR({ ...newKR, unit: e.target.value })}
                                                    className={`${inputClass} w-20`} placeholder="Unit" />
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleAddKR(expandedGoal.id)} className="px-4 py-2 bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-md hover:bg-zinc-800 transition-colors">Add</button>
                                                    <button onClick={() => setAddingKR(null)} className="px-4 py-2 bg-white text-zinc-500 border border-zinc-200 text-[11px] font-bold uppercase tracking-wider rounded-md hover:bg-zinc-50 transition-colors">Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GoalsPage;
