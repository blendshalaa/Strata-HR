import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, Users, AlertTriangle, UserCircle } from 'lucide-react';
import { departmentAPI, userAPI } from '../services/api';
import DepartmentModal from '../components/modals/DepartmentModal';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

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

    const getEmployeeCount = (deptName) => users.filter(u => u.department === deptName).length;

    const handleEdit = (dept) => { setEditingDepartment(dept); setIsDeptModalOpen(true); };

    const handleDelete = async (deptId) => {
        setDeleteLoading(true);
        try {
            await departmentAPI.delete(deptId);
            setShowDeleteConfirm(null);
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
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('departments.searchDepartments')}
                        className="w-full px-4 py-2.5 pl-10 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepartments.map((dept) => {
                    const empCount = getEmployeeCount(dept.name);
                    return (
                        <div key={dept.id} className="card group">
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
                            <p className="text-zinc-600 text-[13px] mb-5 line-clamp-2 min-h-[2.5rem]">{dept.description || t('common.noDescription')}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <div className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-600 font-medium text-[11px] flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {empCount} {empCount === 1 ? t('common.member') : t('common.members')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleEdit(dept)} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors rounded-md border border-transparent hover:border-zinc-200"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => setShowDeleteConfirm(dept)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-md border border-transparent hover:border-red-200"><Trash2 className="w-4 h-4" /></button>
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
