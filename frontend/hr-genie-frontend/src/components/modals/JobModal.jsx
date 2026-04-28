import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const JobModal = ({ isOpen, onClose, onJobAdded }) => {
    const [title, setTitle] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState('');
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            fetchDepartments();
            // Reset form
            setTitle('');
            setDepartmentId('');
            setDescription('');
            setRequirements('');
            setError(null);
        }
    }, [isOpen]);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data.departments || []);
        } catch (err) {
            console.error('Failed to fetch departments for job modal', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const newJob = {
                title,
                department_id: departmentId || null,
                description,
                requirements
            };

            const res = await api.post('/recruitment/jobs', newJob);
            onJobAdded(res.data.job);
            onClose();
        } catch (err) {
            console.error('Failed to create job', err);
            setError(err.response?.data?.error || 'An error occurred while creating the job.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-zinc-900/40 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white border border-zinc-200 rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-slideUp">
                <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                    <h2 className="text-[16px] font-bold text-zinc-900">{t('jobModal.postNewJob')}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('jobModal.jobTitle')} <span className="text-zinc-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                            placeholder="e.g. Senior Frontend Developer"
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('departments.department')}
                        </label>
                        <select
                            value={departmentId}
                            onChange={(e) => setDepartmentId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                        >
                            <option value="">{t('jobModal.selectDepartment')}</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('jobModal.jobDescription')} <span className="text-zinc-400">*</span>
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none"
                            placeholder={t('jobModal.jobDescriptionPlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('jobModal.requirementsLabel')}
                        </label>
                        <textarea
                            rows={3}
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none"
                            placeholder={t('jobModal.requirementsPlaceholder')}
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 mt-6">
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
                            className={`px-4 py-2 text-[13px] font-bold text-white bg-zinc-900 border border-zinc-900 rounded-md hover:bg-zinc-800 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? t('jobModal.posting') : t('jobModal.postJob')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobModal;
