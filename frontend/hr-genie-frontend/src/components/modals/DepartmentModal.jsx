import React, { useState, useEffect } from 'react';
import { X, Building2, Edit } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const DepartmentModal = ({ isOpen, onClose, onDepartmentSaved, onDepartmentAdded, department }) => {
    const isEditMode = !!department;
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [managerId, setManagerId] = useState('');
    const [description, setDescription] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            if (department) {
                setName(department.name || '');
                setManagerId(department.manager_id ? String(department.manager_id) : '');
                setDescription(department.description || '');
            } else {
                setName('');
                setManagerId('');
                setDescription('');
            }
            setError(null);
        }
    }, [isOpen, department]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.users || []);
        } catch (err) {
            console.error('Failed to fetch users for department modal', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const deptData = {
                name,
                manager_id: managerId || null,
                description
            };

            if (isEditMode) {
                await api.put(`/departments/${department.id}`, deptData);
            } else {
                const res = await api.post('/departments', deptData);
                // Support legacy callback
                if (onDepartmentAdded) {
                    onDepartmentAdded(res.data.department);
                }
            }

            if (onDepartmentSaved) {
                onDepartmentSaved();
            } else {
                onClose();
            }
        } catch (err) {
            console.error(`Failed to ${isEditMode ? 'update' : 'create'} department`, err);
            setError(err.response?.data?.error || `An error occurred while ${isEditMode ? 'updating' : 'creating'} the department.`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fadeIn" onClick={onClose}>
            <div className="modal-panel animate-slideUp" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-zinc-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 border border-zinc-200 rounded-md">
                            {isEditMode
                                ? <Edit className="w-4 h-4 text-zinc-600" />
                                : <Building2 className="w-4 h-4 text-zinc-600" />
                            }
                        </div>
                        <h2 className="text-[16px] font-bold text-zinc-900">
                            {isEditMode ? t('departmentModal.editDepartment') : t('departmentModal.addNew')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('departmentModal.departmentName')} <span className="text-zinc-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                            placeholder="e.g. Engineering"
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('departmentModal.manager')}
                        </label>
                        <select
                            value={managerId}
                            onChange={(e) => setManagerId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                        >
                            <option value="">{t('departmentModal.selectManager')}</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('departmentModal.description')}
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none"
                            placeholder={t('departmentModal.descriptionPlaceholder')}
                        />
                    </div>
                    </div>

                    <div className="p-5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-[13px] font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-[13px] font-bold text-white bg-[#111318] border border-[#111318] rounded-md hover:bg-[#374151] transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading
                                ? (isEditMode ? t('common.saving') : t('departmentModal.creating'))
                                : (isEditMode ? t('common.saveChanges') : t('departmentModal.createDepartment'))
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>

    );
};

export default DepartmentModal;
