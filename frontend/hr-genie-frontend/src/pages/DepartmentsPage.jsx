import React, { useState, useEffect, useRef } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, Users, AlertTriangle, UserCircle, X, UserPlus, ChevronRight, UserMinus } from 'lucide-react';
import { departmentAPI, userAPI } from '../services/api';
import DepartmentModal from '../components/modals/DepartmentModal';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

// Deterministic initials colour (same palette as UserManagementPage)
const INITIALS_COLORS = [
    'bg-blue-100 border-blue-200 text-blue-900',
    'bg-emerald-100 border-emerald-200 text-emerald-900',
    'bg-violet-100 border-violet-200 text-violet-900',
    'bg-amber-100 border-amber-200 text-amber-900',
    'bg-rose-100 border-rose-200 text-rose-900',
    'bg-sky-100 border-sky-200 text-sky-900',
    'bg-orange-100 border-orange-200 text-orange-900',
    'bg-teal-100 border-teal-200 text-teal-900',
];
const getInitialsColor = (name = '') => {
    const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return INITIALS_COLORS[hash % INITIALS_COLORS.length];
};
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// ─── Member Panel (slide-over) ────────────────────────────────────────────────
const MemberPanel = ({ dept, users, onClose, onRefresh }) => {
    const toast = useToast();
    const { t } = useTranslation();
    const [memberSearch, setMemberSearch] = useState('');
    const [addSearch, setAddSearch] = useState('');
    const [showAddList, setShowAddList] = useState(false);
    const [saving, setSaving] = useState(null); // userId being updated
    const addRef = useRef(null);

    const members = users.filter(u => u.department === dept.name);
    const nonMembers = users.filter(u => u.department !== dept.name);

    const filteredMembers = members.filter(u =>
        u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(memberSearch.toLowerCase())
    );
    const filteredAdd = nonMembers.filter(u =>
        u.name.toLowerCase().includes(addSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(addSearch.toLowerCase())
    );

    // Close add dropdown on outside click
    useEffect(() => {
        const handler = (e) => { if (addRef.current && !addRef.current.contains(e.target)) setShowAddList(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const assignUser = async (userId, newDept) => {
        setSaving(userId);
        try {
            await userAPI.update(userId, { department: newDept });
            await onRefresh();
            if (newDept) toast.success(`Assigned to ${dept.name}`);
            else toast.success('Removed from department');
        } catch {
            toast.error('Failed to update department');
        } finally {
            setSaving(null);
            setAddSearch('');
            setShowAddList(false);
        }
    };

    const getRoleBadge = (role) => {
        const map = {
            admin: 'bg-red-50 text-red-700 border-red-200',
            hr: 'bg-amber-50 text-amber-700 border-amber-200',
            employee: 'bg-zinc-100 text-zinc-600 border-zinc-200',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${map[role] || map.employee}`}>
                {role}
            </span>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-zinc-900/30 z-40 transition-opacity" onClick={onClose} />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-slideInRight">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 border border-zinc-200 rounded-md">
                            <Building2 className="w-5 h-5 text-zinc-600" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-black text-zinc-900">{dept.name}</h2>
                            <p className="text-[12px] text-zinc-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-md transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                {/* Add Member */}
                <div className="px-6 py-4 border-b border-zinc-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Add Member</p>
                    <div className="relative" ref={addRef}>
                        <div className="relative">
                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                value={addSearch}
                                onChange={e => { setAddSearch(e.target.value); setShowAddList(true); }}
                                onFocus={() => setShowAddList(true)}
                                placeholder={`Search ${nonMembers.length} available employee${nonMembers.length !== 1 ? 's' : ''}…`}
                                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 text-[13px] font-medium outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                            />
                        </div>
                        {showAddList && filteredAdd.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg z-10 max-h-52 overflow-y-auto">
                                {filteredAdd.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => assignUser(u.id, dept.name)}
                                        disabled={saving === u.id}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-0 disabled:opacity-50"
                                    >
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-black border shrink-0 ${getInitialsColor(u.name)}`}>
                                            {getInitials(u.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold text-zinc-900 truncate">{u.name}</p>
                                            <p className="text-[11px] text-zinc-400 truncate">{u.department ? `From: ${u.department}` : 'Unassigned'}</p>
                                        </div>
                                        {getRoleBadge(u.role)}
                                    </button>
                                ))}
                            </div>
                        )}
                        {showAddList && addSearch && filteredAdd.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg z-10 p-4 text-center text-[13px] text-zinc-400">
                                No matching employees
                            </div>
                        )}
                    </div>
                </div>

                {/* Member list */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-6 pt-4 pb-2">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Members</p>
                            {members.length > 4 && (
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={memberSearch}
                                        onChange={e => setMemberSearch(e.target.value)}
                                        placeholder="Filter…"
                                        className="pl-7 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-[12px] font-medium text-zinc-700 outline-none focus:border-zinc-900 transition-all w-28"
                                    />
                                </div>
                            )}
                        </div>

                        {filteredMembers.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                                <p className="text-[13px] font-bold text-zinc-400">
                                    {memberSearch ? 'No matching members' : 'No members yet'}
                                </p>
                                <p className="text-[12px] text-zinc-400 mt-1">
                                    {!memberSearch && 'Use the search above to add employees.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredMembers.map(u => (
                                    <div key={u.id} className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-md group hover:border-zinc-200 transition-all">
                                        <div className={`w-9 h-9 rounded-md flex items-center justify-center text-[11px] font-black border shrink-0 ${getInitialsColor(u.name)}`}>
                                            {getInitials(u.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold text-zinc-900 truncate">{u.name}</p>
                                            <p className="text-[11px] text-zinc-400 truncate">{u.email}</p>
                                        </div>
                                        {getRoleBadge(u.role)}
                                        <button
                                            onClick={() => assignUser(u.id, '')}
                                            disabled={saving === u.id}
                                            title="Remove from department"
                                            className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 shrink-0"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const DepartmentsPage = () => {
    const toast = useToast();
    const { t } = useTranslation();
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null); // panel

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [deptRes, userRes] = await Promise.all([
                departmentAPI.getAll(),
                userAPI.getAll({}).catch(() => ({ data: { users: [] } }))
            ]);
            setDepartments(deptRes.data.departments || []);
            setUsers(userRes.data.users || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally { setLoading(false); }
    };

    // After a member assignment, refresh users without full reload
    const refreshUsers = async () => {
        try {
            const res = await userAPI.getAll({});
            setUsers(res.data.users || []);
        } catch { /* silent */ }
    };

    const getDeptMembers = (deptName) => users.filter(u => u.department === deptName);
    const getEmployeeCount = (deptName) => getDeptMembers(deptName).length;
    const unassignedCount = users.filter(u => !u.department).length;

    const handleEdit = (dept, e) => { e.stopPropagation(); setEditingDepartment(dept); setIsDeptModalOpen(true); };
    const handleDeleteClick = (dept, e) => { e.stopPropagation(); setShowDeleteConfirm(dept); };

    const handleDelete = async (deptId) => {
        setDeleteLoading(true);
        try {
            await departmentAPI.delete(deptId);
            setShowDeleteConfirm(null);
            if (selectedDept?.id === deptId) setSelectedDept(null);
            toast.success(t('departments.departmentDeleted'));
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || t('departments.failedToDelete'));
        } finally { setDeleteLoading(false); }
    };

    const handleModalClose = () => { setIsDeptModalOpen(false); setEditingDepartment(null); };
    const handleDepartmentSaved = () => { handleModalClose(); fetchData(); };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dept.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (<div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>);
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('departments.title')}</h1>
                    <p className="text-zinc-500 text-sm mt-1">{t('departments.subtitle')}</p>
                </div>
                <button onClick={() => { setEditingDepartment(null); setIsDeptModalOpen(true); }} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> {t('departments.addDepartment')}
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <div className="card flex items-center gap-3 flex-shrink-0 p-3 sm:p-4">
                    <div className="p-2 bg-zinc-100 rounded-md border border-zinc-200"><Building2 className="w-5 h-5 text-zinc-600" /></div>
                    <div>
                        <p className="text-[12px] text-zinc-500 font-medium">{t('departments.totalDepartments')}</p>
                        <p className="text-xl font-bold text-zinc-900">{departments.length}</p>
                    </div>
                </div>
                {unassignedCount > 0 && (
                    <button
                        onClick={() => setSelectedDept({ name: '__unassigned__', id: null, _isUnassigned: true })}
                        className="card flex items-center gap-3 flex-shrink-0 p-3 sm:p-4 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                    >
                        <div className="p-2 bg-amber-100 rounded-md border border-amber-200"><Users className="w-5 h-5 text-amber-600" /></div>
                        <div>
                            <p className="text-[12px] text-amber-600 font-medium">Unassigned</p>
                            <p className="text-xl font-bold text-amber-900">{unassignedCount}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-amber-400 ml-auto" />
                    </button>
                )}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('departments.searchDepartments')}
                        className="w-full px-4 py-2.5 pl-10 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepartments.map((dept) => {
                    const empCount = getEmployeeCount(dept.name);
                    const isSelected = selectedDept?.id === dept.id;
                    return (
                        <div
                            key={dept.id}
                            onClick={() => setSelectedDept(dept)}
                            className={`card group cursor-pointer transition-all hover:border-zinc-400 hover:shadow-md ${isSelected ? 'border-zinc-900 shadow-md ring-1 ring-zinc-900' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-zinc-100 border border-zinc-200 rounded-md"><Building2 className="w-5 h-5 text-zinc-600" /></div>
                                    <div>
                                        <h3 className="text-[15px] font-bold text-zinc-900">{dept.name}</h3>
                                        <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 mt-0.5">
                                            <UserCircle className="w-3.5 h-3.5" />
                                            {dept.manager_name || <span className="italic text-zinc-400">{t('departments.noManager')}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-zinc-600 text-[13px] mb-4 line-clamp-2 min-h-[2.5rem]">{dept.description || t('common.noDescription')}</p>

                            {/* Member avatar row */}
                            {getDeptMembers(dept.name).length > 0 && (
                                <div className="flex items-center gap-1.5 mb-4">
                                    {getDeptMembers(dept.name).slice(0, 4).map((member) => (
                                        <div key={member.id} title={member.name}
                                            className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black border shrink-0 ${getInitialsColor(member.name)}`}>
                                            {getInitials(member.name)}
                                        </div>
                                    ))}
                                    {getDeptMembers(dept.name).length > 4 && (
                                        <div className="w-7 h-7 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-500">
                                            +{getDeptMembers(dept.name).length - 4}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <div className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-600 font-medium text-[11px] flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {empCount} {empCount === 1 ? t('common.member') : t('common.members')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={(e) => handleEdit(dept, e)} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors rounded-md border border-transparent hover:border-zinc-200"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={(e) => handleDeleteClick(dept, e)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-md border border-transparent hover:border-red-200"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredDepartments.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white rounded-lg border border-dashed border-zinc-300">
                        <Building2 className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
                        <p className="font-medium text-zinc-600 text-sm">{t('departments.noDepartments')}</p>
                        <p className="text-[13px] text-zinc-400 mt-1">{searchQuery ? t('departments.tryDifferentSearch') : t('departments.createFirst')}</p>
                    </div>
                )}
            </div>

            <DepartmentModal isOpen={isDeptModalOpen} onClose={handleModalClose} onDepartmentSaved={handleDepartmentSaved} department={editingDepartment} />

            {/* Member management panel */}
            {selectedDept && !selectedDept._isUnassigned && (
                <MemberPanel
                    dept={selectedDept}
                    users={users}
                    onClose={() => setSelectedDept(null)}
                    onRefresh={refreshUsers}
                />
            )}

            {/* Unassigned panel */}
            {selectedDept?._isUnassigned && (
                <>
                    <div className="fixed inset-0 bg-zinc-900/30 z-40" onClick={() => setSelectedDept(null)} />
                    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-slideInRight">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 border border-amber-200 rounded-md">
                                    <Users className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-[15px] font-black text-zinc-900">Unassigned Employees</h2>
                                    <p className="text-[12px] text-zinc-500">{unassignedCount} without a department</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDept(null)} className="p-2 hover:bg-zinc-100 rounded-md transition-colors">
                                <X className="w-5 h-5 text-zinc-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                            {users.filter(u => !u.department).map(u => (
                                <div key={u.id} className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-md">
                                    <div className={`w-9 h-9 rounded-md flex items-center justify-center text-[11px] font-black border shrink-0 ${getInitialsColor(u.name)}`}>
                                        {getInitials(u.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-zinc-900 truncate">{u.name}</p>
                                        <p className="text-[11px] text-zinc-400 truncate">{u.email}</p>
                                    </div>
                                    <select
                                        defaultValue=""
                                        onChange={async (e) => {
                                            if (!e.target.value) return;
                                            try {
                                                await userAPI.update(u.id, { department: e.target.value });
                                                await refreshUsers();
                                            } catch { /* silent */ }
                                        }}
                                        className="text-[12px] font-medium border border-zinc-200 rounded-md px-2 py-1.5 bg-white text-zinc-700 outline-none focus:border-zinc-900 transition-all max-w-[140px]"
                                    >
                                        <option value="">Assign to…</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-zinc-900/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="bg-white border border-zinc-200 rounded-lg max-w-md w-full animate-slideUp shadow-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">{t('departments.deleteDepartment')}</h3>
                            <p className="text-zinc-600 text-sm mb-1">{t('departments.deleteConfirm')} <strong>{showDeleteConfirm.name}</strong>?</p>
                            <p className="text-[13px] text-zinc-500">
                                {getEmployeeCount(showDeleteConfirm.name) > 0
                                    ? t('departments.hasMembers', { count: getEmployeeCount(showDeleteConfirm.name) })
                                    : t('departments.cannotBeUndone')}
                            </p>
                        </div>
                        <div className="border-t border-zinc-100 p-4 flex gap-3 bg-zinc-50 rounded-b-lg">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-white border border-zinc-300 text-zinc-700 rounded-md hover:bg-zinc-50 transition-colors text-sm font-semibold">{t('common.cancel')}</button>
                            <button onClick={() => handleDelete(showDeleteConfirm.id)} disabled={deleteLoading} className="flex-1 px-4 py-2.5 bg-red-600 border border-red-700 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50">
                                {deleteLoading ? t('common.deleting') : t('departments.deleteDepartment')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentsPage;
