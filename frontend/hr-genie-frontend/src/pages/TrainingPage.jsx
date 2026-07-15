import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { BookOpen, CheckCircle2, Clock, Plus, Trash2, GraduationCap, Video, Users, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const TrainingPage = () => {
    const { isHR, user } = useAuth();
    const { t } = useTranslation();
    const toast = useToast();

    const [trainings, setTrainings] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Admin state
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newLink, setNewLink] = useState('');
    const [newDuration, setNewDuration] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [assignModal, setAssignModal] = useState(null);
    const [assignUserId, setAssignUserId] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [trainRes, assignRes] = await Promise.all([
                api.get('/trainings'),
                api.get('/trainings/my-assignments')
            ]);
            setTrainings(trainRes.data.trainings || []);
            setAssignments(assignRes.data.assigned_trainings || []);
            
            if (isHR) {
                const usersRes = await api.get('/users');
                setUsers(usersRes.data.users || []);
            }
        } catch (error) {
            toast.error('Failed to load training data');
        } finally {
            setLoading(false);
        }
    };

    // -- Employee Actions --
    const handleComplete = async (assignmentId) => {
        try {
            await api.post(`/trainings/assignments/${assignmentId}/complete`);
            toast.success('Training marked as completed!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to complete training');
        }
    };

    // -- Admin/HR Actions --
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/trainings', {
                title: newTitle,
                description: newDesc,
                link_url: newLink,
                duration_minutes: newDuration ? parseInt(newDuration) : null
            });
            toast.success('Training course created successfully');
            setShowCreate(false);
            setNewTitle('');
            setNewDesc('');
            setNewLink('');
            setNewDuration('');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create training');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/trainings/${id}`);
            toast.success('Training deleted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete training');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!assignUserId || !assignModal) return;
        try {
            await api.post('/trainings/assign', {
                user_id: assignUserId,
                training_id: assignModal.id
            });
            toast.success('Training assigned to employee successfully');
            setAssignModal(null);
            setAssignUserId('');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to assign training');
        }
    };

    const inputClass = "w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm font-medium";

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
        );
    }

    const completedCount = assignments.filter(a => a.status === 'completed').length;
    const progressPercent = assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0;

    return (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
                            <GraduationCap className="w-5 h-5" style={{ color: '#374151' }} />
                        </div>
                        <h1 className="text-xl font-bold text-zinc-900">{t('training.title', 'Training & Learning')}</h1>
                    </div>
                    <p className="text-[13px] text-zinc-500 ml-[52px]">
                        {t('training.subtitle', 'Develop your skills and track your required company courses.')}
                    </p>
                </div>
                {isHR && (
                    <button 
                        onClick={() => setShowCreate(!showCreate)} 
                        className="bg-[#111318] hover:bg-[#374151] text-white px-5 py-2.5 rounded-md font-bold text-sm transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> {t('training.createCourse', 'Create Course')}
                    </button>
                )}
            </div>

            {/* My Training Progress (Employees) */}
            {!isHR && (
                <div className="card border-l-4 border-l-zinc-900">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-zinc-100" strokeWidth="4" stroke="currentColor" fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="text-zinc-900 transition-all duration-1000" strokeDasharray={`${progressPercent}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <span className="absolute text-[13px] font-black text-zinc-900">{progressPercent}%</span>
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-zinc-900 mb-1">{t('training.yourProgress', 'Your Learning Progress')}</h3>
                                <p className="text-[13px] text-zinc-500">
                                    {t('training.completedInfo', 'You have completed {{completedCount}} out of {{totalCount}} assigned courses.', { completedCount, totalCount: assignments.length })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Create Form */}
            {showCreate && isHR && (
                <div className="card animate-fadeIn">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[14px] font-black text-zinc-900 uppercase tracking-widest">Create New Course</h3>
                    </div>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Course Title</label>
                            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className={inputClass} placeholder="e.g., Security Awareness 2026" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className={inputClass} rows="3" placeholder="Course details..."></textarea>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">External Link / Video URL</label>
                            <input type="url" value={newLink} onChange={e => setNewLink(e.target.value)} className={inputClass} placeholder="https://..." />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                            <input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} className={inputClass} placeholder="45" />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors">Cancel</button>
                            <button type="submit" className="bg-[#111318] hover:bg-[#374151] text-white px-6 py-2 rounded-md font-bold text-sm transition-colors">Create Course</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: My Assignments */}
                <div className="space-y-4">
                    <h2 className="text-[14px] font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2">{t('training.myAssignments', 'My Assignments')}</h2>
                    
                    {assignments.length === 0 ? (
                        <div className="card text-center py-10">
                            <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                            <p className="text-[13px] font-semibold text-zinc-500">{t('training.noAssignments', 'You don\'t have any assigned training.')}</p>
                        </div>
                    ) : (
                        assignments.map(a => (
                            <div key={a.id} className={`card p-5 transition-all ${a.status === 'completed' ? 'opacity-70 bg-zinc-50' : 'hover:border-zinc-400'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            {a.status === 'completed' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
                                                    <CheckCircle2 className="w-3 h-3" /> Completed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 uppercase tracking-wider">
                                                    <Clock className="w-3 h-3" /> In Progress
                                                </span>
                                            )}
                                            {a.duration_minutes && (
                                                <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {a.duration_minutes} min
                                                </span>
                                            )}
                                        </div>
                                        <h3 className={`text-[15px] font-bold ${a.status === 'completed' ? 'text-zinc-600 line-through decoration-zinc-300' : 'text-zinc-900'}`}>{a.title}</h3>
                                        <p className="text-[13px] text-zinc-500 mt-1 line-clamp-2">{a.description}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-100">
                                    {a.link_url ? (
                                        <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-zinc-900 hover:text-zinc-600 flex items-center gap-1.5 transition-colors">
                                            <Video className="w-4 h-4" /> Open Course Material
                                        </a>
                                    ) : <span />}
                                    
                                    {a.status !== 'completed' && (
                                        <button 
                                            onClick={() => handleComplete(a.id)}
                                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-4 py-1.5 rounded-md text-[12px] font-bold transition-colors flex items-center gap-1.5"
                                        >
                                            <Check className="w-3.5 h-3.5" /> Mark Completed
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right Column: Course Library (Full for Admin, List for employees to browse) */}
                <div className="space-y-4">
                    <h2 className="text-[14px] font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2">{t('training.courseLibrary', 'Course Library')}</h2>
                    
                    {trainings.length === 0 ? (
                        <div className="card text-center py-10">
                            <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                            <p className="text-[13px] font-semibold text-zinc-500">{t('training.emptyLibrary', 'No courses available in the library yet.')}</p>
                        </div>
                    ) : (
                        trainings.map(t => (
                            <div key={t.id} className="card p-4 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-[14px] font-bold text-zinc-900">{t.title}</h3>
                                    {isHR && (
                                        <button onClick={() => setDeleteConfirm(t.id)} className="text-zinc-400 hover:text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-[12px] text-zinc-500 line-clamp-2 mb-3">{t.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> {t.duration_minutes ? `${t.duration_minutes} min` : 'Self-paced'}
                                    </span>
                                    {isHR && (
                                        <button 
                                            onClick={() => setAssignModal(t)}
                                            className="text-[12px] font-bold text-zinc-900 hover:text-zinc-600 flex items-center gap-1 transition-colors"
                                        >
                                            <Users className="w-3.5 h-3.5" /> Assign to Employee
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Assign Modal (Admin Only) */}
            {assignModal && isHR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
                            <h2 className="text-[15px] font-bold text-zinc-900">Assign Training</h2>
                            <button onClick={() => setAssignModal(null)} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-md transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-[13px] font-medium text-zinc-600 mb-4">
                                Select an employee to assign <span className="font-bold text-zinc-900">{assignModal.title}</span>.
                            </p>
                            <form onSubmit={handleAssign}>
                                <div className="mb-6">
                                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Employee</label>
                                    <select 
                                        value={assignUserId} 
                                        onChange={e => setAssignUserId(e.target.value)} 
                                        className={inputClass} 
                                        required
                                    >
                                        <option value="" disabled>Select employee...</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department || 'No Dept'})</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setAssignModal(null)} className="px-5 py-2 text-[13px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors">Cancel</button>
                                    <button type="submit" disabled={!assignUserId} className="bg-[#111318] hover:bg-[#374151] text-white px-6 py-2 rounded-md font-bold text-[13px] transition-colors disabled:opacity-50">Assign Training</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => handleDelete(deleteConfirm)}
                title="Delete Course"
                message="Are you sure you want to delete this course from the library? This will also remove it from employees' assignments. This action cannot be undone."
                confirmLabel="Delete"
            />
        </div>
    );
};

export default TrainingPage;
