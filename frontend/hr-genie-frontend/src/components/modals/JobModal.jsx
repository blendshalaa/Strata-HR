import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Check, Briefcase } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const JobModal = ({ isOpen, onClose, onJobAdded }) => {
    const [title, setTitle] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState('');
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [postedJob, setPostedJob] = useState(null);
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();
    const { orgSlug } = useAuth();

    useEffect(() => {
        if (isOpen) {
            fetchDepartments();
            // Reset form
            setTitle('');
            setDepartmentId('');
            setDescription('');
            setRequirements('');
            setError(null);
            setPostedJob(null);
            setCopied(false);
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
            setPostedJob(res.data.job);
        } catch (err) {
            console.error('Failed to create job', err);
            setError(err.response?.data?.error || 'An error occurred while creating the job.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const careersUrl = orgSlug
        ? `${window.location.origin}/careers?org=${orgSlug}`
        : `${window.location.origin}/careers`;

    const handleCopy = () => {
        navigator.clipboard.writeText(careersUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Success state — show shareable link
    if (postedJob) {
        return (
            <div className="modal-overlay animate-fadeIn">
                <div className="modal-panel animate-slideUp max-w-md">
                    <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                        <h2 className="text-[16px] font-bold text-zinc-900">Job Posted!</h2>
                        <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="flex items-center gap-3 p-4 bg-[#EEF0FF] border border-[#C4BDFF] rounded-md">
                            <div className="p-2 bg-[#5B4FE8] rounded-md shrink-0">
                                <Briefcase className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-zinc-900">{postedJob.title}</p>
                                <p className="text-[11px] text-[#5B4FE8] font-bold uppercase tracking-wider mt-0.5">Live — accepting applications</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Share this link with candidates</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[12px] text-zinc-600 font-mono truncate">
                                    {careersUrl}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-md text-[12px] font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
                                >
                                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                                </button>
                                <a href={careersUrl} target="_blank" rel="noopener noreferrer"
                                    className="shrink-0 p-2 bg-white border border-zinc-200 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-2">Candidates apply directly from this public page — no login required.</p>
                        </div>

                        <button onClick={onClose}
                            className="w-full py-2.5 text-[13px] font-bold text-white bg-[#5B4FE8] rounded-md hover:bg-[#4a3fd4] transition-colors">
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay animate-fadeIn">
            <div className="modal-panel animate-slideUp">
                <div className="flex items-center justify-between p-5 border-b border-zinc-100 flex-shrink-0">
                    <h2 className="text-[16px] font-bold text-zinc-900">{t('jobModal.postNewJob')}</h2>
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
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
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
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
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
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none"
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
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none"
                            placeholder={t('jobModal.requirementsPlaceholder')}
                        />
                    </div>
                    </div>

                    <div className="p-5 border-t border-zinc-100 flex items-center justify-end gap-3 flex-shrink-0">
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
                            className={`px-4 py-2 text-[13px] font-bold text-white bg-[#5B4FE8] border border-[#5B4FE8] rounded-md hover:bg-[#4a3fd4] transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
