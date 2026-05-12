import React, { useState, useEffect } from 'react';
import { Briefcase, FileText, CheckCircle, XCircle, Clock, Plus, Search, UserPlus, ChevronDown, X, AlertTriangle, ExternalLink, Sparkles, UploadCloud } from 'lucide-react';
import api from '../services/api';
import JobModal from '../components/modals/JobModal';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RecruitmentPage = () => {
    const toast = useToast();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('jobs');
    const [jobsExpanded, setJobsExpanded] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);
    const [isAIScreeningModalOpen, setIsAIScreeningModalOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(null);

    useEffect(() => {
        fetchRecruitmentData();
    }, []);

    const fetchRecruitmentData = async () => {
        setLoading(true);
        try {
            const [jobsRes, appsRes] = await Promise.all([
                api.get('/recruitment/jobs'),
                api.get('/recruitment/applications'),
            ]);
            setJobs(jobsRes.data.jobs || []);
            setApplications(appsRes.data.applications || []);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (applicationId, newStatus) => {
        setUpdatingStatus(applicationId);
        try {
            await api.put(`/recruitment/applications/${applicationId}/status`, { status: newStatus });
            setApplications(prev =>
                prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app)
            );
            toast.success(t('recruitment.applicationUpdated', { status: newStatus }));
        } catch (err) {
            toast.error(err.response?.data?.error || t('recruitment.failedToUpdateStatus'));
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleJobStatusUpdate = async (jobId, newStatus) => {
        try {
            await api.put(`/recruitment/jobs/${jobId}`, { status: newStatus });
            setJobs(prev =>
                prev.map(job => job.id === jobId ? { ...job, status: newStatus } : job)
            );
            toast.success(newStatus === 'closed' ? t('recruitment.jobClosed') : t('recruitment.jobReopened'));
        } catch (err) {
            toast.error(err.response?.data?.error || t('recruitment.failedToUpdateJob'));
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            applied: { icon: Clock, label: 'Applied', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
            interviewing: { icon: FileText, label: 'Interviewing', classes: 'text-blue-700 bg-blue-50 border-blue-200' },
            hired: { icon: CheckCircle, label: 'Hired', classes: 'text-green-700 bg-green-50 border-green-200' },
            rejected: { icon: XCircle, label: 'Rejected', classes: 'text-red-700 bg-red-50 border-red-200' },
        };
        const cfg = config[status] || config.applied;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${cfg.classes}`}>
                <Icon className="w-3 h-3" />
                {cfg.label}
            </span>
        );
    };

    const getJobStatusBadge = (status) => {
        const config = {
            open: 'bg-green-50 text-green-700 border-green-100',
            closed: 'bg-zinc-50 text-zinc-500 border-zinc-200',
            draft: 'bg-amber-50 text-amber-700 border-amber-100',
        };
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${config[status] || config.open}`}>
                {status}
            </span>
        );
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = !searchQuery ||
            app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pipelineStats = {
        applied: applications.filter(a => a.status === 'applied').length,
        interviewing: applications.filter(a => a.status === 'interviewing').length,
        hired: applications.filter(a => a.status === 'hired').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    };

    const renderJobs = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-[16px] font-bold text-zinc-900">
                    {t('recruitment.jobPostings')}
                    <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider ml-2">{jobs.length} {t('common.total')}</span>
                </h2>
                <button
                    onClick={() => setIsJobModalOpen(true)}
                    className="flex items-center gap-2 bg-[#5B4FE8] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-[#4a3fd4] transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    {t('recruitment.postNewJob')}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(job => (
                    <div key={job.id} className="card bg-white border border-zinc-200 hover:border-[#C4BDFF] transition-colors group p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-md">
                                <Briefcase className="w-5 h-5 text-zinc-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[15px] font-bold text-zinc-900 truncate">{job.title}</h3>
                                <p className="text-[13px] text-zinc-500 mb-4">{job.department_name || t('recruitment.noDepartment')}</p>
                                <div className="flex items-center justify-between">
                                    {getJobStatusBadge(job.status)}
                                    <div className="flex items-center gap-3">
                                        {job.status === 'open' && (
                                            <button
                                                onClick={() => handleJobStatusUpdate(job.id, 'closed')}
                                                className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider hover:text-red-600 transition-colors"
                                            >
                                                {t('recruitment.closeJob')}
                                            </button>
                                        )}
                                        {job.status === 'closed' && (
                                            <button
                                                onClick={() => handleJobStatusUpdate(job.id, 'open')}
                                                className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider hover:text-green-600 transition-colors"
                                            >
                                                {t('recruitment.reopenJob')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {job.description && (
                            <p className="mt-4 text-[13px] text-zinc-600 line-clamp-2 border-t border-zinc-100 pt-4 italic">
                                {job.description}
                            </p>
                        )}
                        {job.status === 'open' && (
                            <button
                                onClick={() => { setSelectedJobId(job.id); setIsAIScreeningModalOpen(true); }}
                                className="mt-4 w-full flex items-center justify-center gap-2 bg-zinc-50 text-zinc-900 border border-zinc-200 hover:bg-zinc-100 hover:border-[#C4BDFF] px-4 py-2.5 rounded-md text-[12px] font-bold uppercase tracking-wider transition-colors"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
                                {t('recruitment.aiScreenResume')}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {jobs.length === 0 && !loading && (
                <div className="text-center py-16 bg-white border border-zinc-200 rounded-md">
                    <Briefcase className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                    <p className="text-[13px] font-bold text-zinc-900 uppercase tracking-wider">{t('recruitment.noJobPostings')}</p>
                    <p className="text-[12px] text-zinc-500 mt-1">{t('recruitment.createFirstJob')}</p>
                </div>
            )}
        </div>
    );

    const renderApplications = () => (
        <div className="space-y-4">
            {/* Pipeline Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card bg-white border border-zinc-200 cursor-pointer hover:border-[#C4BDFF] transition-colors" onClick={() => setStatusFilter(statusFilter === 'applied' ? '' : 'applied')}>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 border border-amber-100 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.applied')}</span>
                    </div>
                    <p className="text-2xl font-black text-zinc-900 mt-2 tracking-tight">{pipelineStats.applied}</p>
                </div>
                <div className="card bg-white border border-zinc-200 cursor-pointer hover:border-[#C4BDFF] transition-colors" onClick={() => setStatusFilter(statusFilter === 'interviewing' ? '' : 'interviewing')}>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 border border-blue-100 rounded-md">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.interviewing')}</span>
                    </div>
                    <p className="text-2xl font-black text-zinc-900 mt-2 tracking-tight">{pipelineStats.interviewing}</p>
                </div>
                <div className="card bg-white border border-zinc-200 cursor-pointer hover:border-[#C4BDFF] transition-colors" onClick={() => setStatusFilter(statusFilter === 'hired' ? '' : 'hired')}>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-50 border border-green-100 rounded-md">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.hired')}</span>
                    </div>
                    <p className="text-2xl font-black text-zinc-900 mt-2 tracking-tight">{pipelineStats.hired}</p>
                </div>
                <div className="card bg-white border border-zinc-200 cursor-pointer hover:border-[#C4BDFF] transition-colors" onClick={() => setStatusFilter(statusFilter === 'rejected' ? '' : 'rejected')}>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-50 border border-red-100 rounded-md">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('common.rejected')}</span>
                    </div>
                    <p className="text-2xl font-black text-zinc-900 mt-2 tracking-tight">{pipelineStats.rejected}</p>
                </div>
            </div>

            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('recruitment.searchApplicants')}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors"
                    />
                </div>
                <button
                    onClick={() => setIsApplicantModalOpen(true)}
                    className="flex items-center gap-2 bg-[#5B4FE8] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-[#4a3fd4] transition-colors shadow-sm whitespace-nowrap"
                >
                    <UserPlus className="w-3.5 h-3.5" />
                    {t('recruitment.addApplicant')}
                </button>
            </div>

            {/* Applications Table */}
            <div className="card p-0 overflow-visible bg-white border border-zinc-200">
                <div className="overflow-visible">
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.applicant')}</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.position')}</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('common.status')}</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.changeStatus')}</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.applied')}</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.cv')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filteredApplications.map(app => (
                                <tr key={app.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-zinc-900">{app.applicant_name}</span>
                                            <a href={`mailto:${app.email}`} className="text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors">{app.email}</a>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-[13px] text-zinc-600">{app.job_title}</td>
                                    <td className="px-5 py-4">{getStatusBadge(app.status)}</td>
                                    <td className="px-5 py-4">
                                        <StatusDropdown
                                            currentStatus={app.status}
                                            isLoading={updatingStatus === app.id}
                                            onStatusChange={(status) => handleStatusUpdate(app.id, status)}
                                        />
                                    </td>
                                    <td className="px-5 py-4 text-[12px] font-bold text-zinc-400 uppercase tracking-wider">
                                        {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-5 py-4">
                                        {app.resume_url ? (
                                            <a
                                                href={app.resume_url.startsWith('/uploads') ? `${API_URL.replace('/api', '')}${app.resume_url}` : app.resume_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-zinc-900 uppercase tracking-wider rounded-md hover:bg-zinc-100 transition-colors whitespace-nowrap"
                                                title="View CV/Resume"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                {t('recruitment.viewCv')}
                                            </a>
                                        ) : (
                                            <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider italic">{t('common.noCv')}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredApplications.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center">
                                        <UserPlus className="w-10 h-10 mx-auto mb-3 text-zinc-200" />
                                        <p className="text-[13px] font-bold text-zinc-900 uppercase tracking-wider">{t('recruitment.noApplicants')}</p>
                                        <p className="text-[12px] text-zinc-500 mt-1">
                                            {searchQuery || statusFilter ? t('recruitment.tryDifferentSearch') : t('recruitment.addApplicantsExternally')}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('recruitment.title')}</h1>
                <button onClick={() => setIsJobModalOpen(true)}
                    className="flex items-center gap-2 bg-[#5B4FE8] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-[#4a3fd4] transition-colors">
                    <Plus className="w-3.5 h-3.5" /> {t('recruitment.postNewJob')}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* Jobs — collapsible */}
                    <div className="card bg-white border border-zinc-200">
                        <button onClick={() => setJobsExpanded(!jobsExpanded)}
                            className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-4 h-4 text-zinc-500" />
                                <span className="text-[14px] font-bold text-zinc-900">{t('recruitment.jobPostings')}</span>
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-100 text-zinc-600 rounded-md">{jobs.length}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${jobsExpanded ? '' : '-rotate-90'}`} />
                        </button>
                        {jobsExpanded && (
                            <div className="mt-5 pt-5 border-t border-zinc-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {jobs.map(job => (
                                        <div key={job.id} className="bg-zinc-50 border border-zinc-200 hover:border-[#C4BDFF] transition-colors rounded-md p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white border border-zinc-100 rounded-md shrink-0">
                                                    <Briefcase className="w-4 h-4 text-zinc-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[14px] font-bold text-zinc-900 truncate">{job.title}</h3>
                                                    <p className="text-[12px] text-zinc-500 mb-3">{job.department_name || t('recruitment.noDepartment')}</p>
                                                    <div className="flex items-center justify-between">
                                                        {getJobStatusBadge(job.status)}
                                                        <div className="flex gap-2">
                                                            {job.status === 'open' && (
                                                                <button onClick={() => handleJobStatusUpdate(job.id, 'closed')}
                                                                    className="text-[11px] font-bold text-zinc-400 hover:text-red-600 transition-colors">
                                                                    {t('recruitment.closeJob')}
                                                                </button>
                                                            )}
                                                            {job.status === 'closed' && (
                                                                <button onClick={() => handleJobStatusUpdate(job.id, 'open')}
                                                                    className="text-[11px] font-bold text-zinc-400 hover:text-green-600 transition-colors">
                                                                    {t('recruitment.reopenJob')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {jobs.length === 0 && (
                                    <div className="text-center py-8 text-zinc-400">
                                        <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                        <p className="text-[13px]">{t('recruitment.noJobPostings')}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Applications */}
                    <div className="space-y-4">
                        {/* Pipeline Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { key: 'applied', Icon: Clock, label: t('recruitment.applied'), bg: 'bg-amber-50', border: 'border-amber-100', ic: 'text-amber-600' },
                                { key: 'interviewing', Icon: FileText, label: t('recruitment.interviewing'), bg: 'bg-blue-50', border: 'border-blue-100', ic: 'text-blue-600' },
                                { key: 'hired', Icon: CheckCircle, label: t('recruitment.hired'), bg: 'bg-green-50', border: 'border-green-100', ic: 'text-green-600' },
                                { key: 'rejected', Icon: XCircle, label: t('common.rejected'), bg: 'bg-red-50', border: 'border-red-100', ic: 'text-red-600' },
                            ].map(({ key, Icon, label, bg, border, ic }) => (
                                <div key={key} className="card bg-white border border-zinc-200 cursor-pointer hover:border-[#C4BDFF] transition-colors"
                                    onClick={() => setStatusFilter(statusFilter === key ? '' : key)}>
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-md ${bg} border ${border}`}>
                                            <Icon className={`w-3.5 h-3.5 ${ic}`} />
                                        </div>
                                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
                                    </div>
                                    <p className="text-2xl font-black text-zinc-900 mt-2">{pipelineStats[key]}</p>
                                </div>
                            ))}
                        </div>

                        {/* Search + Add Applicant */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={t('recruitment.searchApplicants')}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors" />
                            </div>
                            <button onClick={() => setIsApplicantModalOpen(true)}
                                className="flex items-center gap-2 bg-[#5B4FE8] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-[#4a3fd4] transition-colors shadow-sm whitespace-nowrap">
                                <UserPlus className="w-3.5 h-3.5" /> {t('recruitment.addApplicant')}
                            </button>
                        </div>

                        {/* Applicants Table */}
                        <div className="card p-0 overflow-x-auto bg-white border border-zinc-200">
                            <table className="w-full">
                                <thead className="bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.applicant')}</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.position')}</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('common.status')}</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.changeStatus')}</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.applied')}</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('recruitment.cv')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredApplications.map(app => (
                                        <tr key={app.id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <span className="text-[13px] font-bold text-zinc-900 block">{app.applicant_name}</span>
                                                <a href={`mailto:${app.email}`} className="text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors">{app.email}</a>
                                            </td>
                                            <td className="px-5 py-4 text-[13px] text-zinc-600">{app.job_title}</td>
                                            <td className="px-5 py-4">{getStatusBadge(app.status)}</td>
                                            <td className="px-5 py-4">
                                                <StatusDropdown currentStatus={app.status} isLoading={updatingStatus === app.id}
                                                    onStatusChange={(status) => handleStatusUpdate(app.id, status)} />
                                            </td>
                                            <td className="px-5 py-4 text-[12px] font-bold text-zinc-400 uppercase tracking-wider">
                                                {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {app.resume_url ? (
                                                        <>
                                                            <a href={app.resume_url.startsWith('/uploads') ? `${API_URL.replace('/api', '')}${app.resume_url}` : app.resume_url}
                                                                target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors whitespace-nowrap">
                                                                <FileText className="w-3.5 h-3.5" /> {t('recruitment.viewCv')}
                                                            </a>
                                                            <button
                                                                onClick={() => { setSelectedJobId(app.job_id); setIsAIScreeningModalOpen(true); }}
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#5B4FE8] bg-[#EEF0FF] border border-[#C4BDFF] rounded-md hover:bg-[#5B4FE8] hover:text-white transition-colors whitespace-nowrap"
                                                                title="AI screen this CV against the job">
                                                                <Sparkles className="w-2.5 h-2.5" /> Screen
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider italic">{t('common.noCv')}</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredApplications.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-12 text-center">
                                                <UserPlus className="w-10 h-10 mx-auto mb-3 text-zinc-200" />
                                                <p className="text-[13px] font-bold text-zinc-900 uppercase tracking-wider">{t('recruitment.noApplicants')}</p>
                                                <p className="text-[12px] text-zinc-500 mt-1">
                                                    {searchQuery || statusFilter ? t('recruitment.tryDifferentSearch') : t('recruitment.addApplicantsExternally')}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <JobModal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} onJobAdded={(newJob) => setJobs([newJob, ...jobs])} />
            {isApplicantModalOpen && (
                <AddApplicantModal jobs={jobs} onClose={() => setIsApplicantModalOpen(false)}
                    onSuccess={() => { setIsApplicantModalOpen(false); fetchRecruitmentData(); }} />
            )}
            {isAIScreeningModalOpen && (
                <AIScreeningModal jobId={selectedJobId} jobTitle={jobs.find(j => j.id === selectedJobId)?.title}
                    onClose={() => { setIsAIScreeningModalOpen(false); setSelectedJobId(null); }} />
            )}
        </div>
    );
};

// Status Dropdown Component
const StatusDropdown = ({ currentStatus, isLoading, onStatusChange }) => {
    const [open, setOpen] = useState(false);

    const { t } = useTranslation();
    const statuses = ['applied', 'interviewing', 'hired', 'rejected'];
    const labels = {
        applied: t('recruitment.statusApplied'),
        interviewing: t('recruitment.statusInterviewing'),
        hired: t('recruitment.statusHired'),
        rejected: t('recruitment.statusRejected')
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-900 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
                <span>{t('recruitment.update')}</span>
                {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin"></div>
                ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                )}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg z-50 w-40 py-1 animate-fadeIn origin-top-left">
                        <p className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-50 mb-1">{t('recruitment.moveTo')}</p>
                        {statuses.filter(s => s !== currentStatus).map(status => (
                            <button
                                key={status}
                                onClick={() => { onStatusChange(status); setOpen(false); }}
                                className="w-full text-left px-3 py-2 text-[12px] font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                            >
                                {labels[status]}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// Add Applicant Modal
const AddApplicantModal = ({ jobs, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        applicant_name: '',
        email: '',
        resume: null,
        job_id: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const openJobs = jobs.filter(j => j.status === 'open');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.job_id) {
            setError('Please select a job posting');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const data = new FormData();
            data.append('applicant_name', formData.applicant_name);
            data.append('email', formData.email);
            if (formData.resume) {
                data.append('resume', formData.resume);
            }

            await api.post(`/recruitment/jobs/${formData.job_id}/applications`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || t('recruitment.failedToAddApplicant'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg max-w-lg w-full animate-fadeIn shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="border-b border-zinc-100 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 border border-zinc-200 rounded-md">
                            <UserPlus className="w-5 h-5 text-zinc-600" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-bold text-zinc-900">{t('recruitment.addApplicantTitle')}</h2>
                            <p className="text-[13px] text-zinc-500">{t('recruitment.addApplicantSubtitle')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-md text-[13px] text-red-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[13px] font-bold text-zinc-700 mb-1.5">{t('recruitment.jobPositionLabel')}</label>
                        <select
                            value={formData.job_id}
                            onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors"
                            required
                        >
                            <option value="">{t('recruitment.selectJobPosting')}</option>
                            {openJobs.map(job => (
                                <option key={job.id} value={job.id}>
                                    {job.title} {job.department_name ? `(${job.department_name})` : ''}
                                </option>
                            ))}
                        </select>
                        {openJobs.length === 0 && (
                            <p className="text-[11px] font-bold text-amber-600 mt-1 uppercase tracking-wider">{t('recruitment.noOpenPositions')}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[13px] font-bold text-zinc-700 mb-1.5">{t('recruitment.applicantNameLabel')}</label>
                        <input
                            type="text"
                            value={formData.applicant_name}
                            onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-bold text-zinc-700 mb-1.5">{t('recruitment.emailLabel')}</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors"
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-bold text-zinc-700 mb-1.5">{t('recruitment.resumeCvLabel')}</label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={(e) => setFormData({ ...formData, resume: e.target.files[0] })}
                            className="w-full text-[12px] text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:uppercase file:tracking-wider file:bg-[#5B4FE8] file:text-white hover:file:bg-[#4a3fd4] transition-colors"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-zinc-100 mt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-[#5B4FE8] text-white px-4 py-2.5 rounded-md hover:bg-[#4a3fd4] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-wider"
                        >
                            <UserPlus className="w-4 h-4" />
                            {loading ? t('recruitment.adding') : t('recruitment.addApplicantBtn')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-white text-zinc-700 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors text-[12px] font-bold uppercase tracking-wider"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// AI Screening Modal
const AIScreeningModal = ({ jobId, jobTitle, onClose }) => {
    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleAnalyze = async () => {
        if (!resume) {
            setError(t('recruitment.pleaseUploadResume'));
            return;
        }

        setError('');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('resume', resume);

            const res = await api.post(`/recruitment/jobs/${jobId}/analyze-resume`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || t('recruitment.failedToAnalyze'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg max-w-2xl w-full animate-slideUp shadow-xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="border-b border-zinc-100 p-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#5B4FE8] rounded-md">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-bold text-zinc-900">{t('recruitment.aiAtsScreening')}</h2>
                            <p className="text-[13px] text-zinc-500">{t('recruitment.evaluatingFor')} <span className="text-zinc-900 font-bold">{jobTitle}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>

                <div className="p-6 relative z-10 max-h-[70vh] overflow-y-auto">
                    {!result ? (
                        <div className="space-y-6">
                            <div className="flex items-start gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
                                <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                <p className="text-[12px] text-zinc-600 leading-relaxed">{t('recruitment.aiScreeningDesc')}</p>
                            </div>
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-[13px] text-red-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="border-2 border-dashed border-zinc-200 bg-zinc-50 rounded-lg p-10 text-center hover:border-[#C4BDFF] transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setResume(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <UploadCloud className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                                <h3 className="text-zinc-900 font-bold text-[15px] mb-1">{t('recruitment.clickOrDragResume')}</h3>
                                <p className="text-zinc-500 text-[13px]">{t('recruitment.mustBePdf')}</p>

                                {resume && (
                                    <div className="mt-4 inline-flex items-center gap-2 bg-[#5B4FE8] text-white px-4 py-2 rounded-md text-[12px] font-bold uppercase tracking-wider">
                                        <FileText className="w-4 h-4" />
                                        {resume.name}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !resume}
                                className="w-full flex items-center justify-center gap-2 bg-[#5B4FE8] text-white py-3 px-6 rounded-md text-[13px] font-bold uppercase tracking-wider hover:bg-[#4a3fd4] transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        {t('recruitment.analyzingCandidate')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        {t('recruitment.scanResume')}
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex flex-col md:flex-row gap-8 items-center bg-zinc-50 p-6 rounded-lg border border-zinc-100">
                                <div className="relative">
                                    <svg className="w-28 h-28 transform -rotate-90">
                                        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-zinc-200" />
                                        <circle
                                            cx="56" cy="56" r="50"
                                            stroke="currentColor" strokeWidth="10" fill="transparent"
                                            strokeDasharray={314.159}
                                            strokeDashoffset={314.159 - (314.159 * result.score) / 100}
                                            className={`${result.score > 75 ? 'text-zinc-900' : result.score > 50 ? 'text-zinc-700' : 'text-red-600'} transition-all duration-1000 ease-out`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-zinc-900 leading-none">{result.score}</span>
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">/ 100</span>
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-[18px] font-bold text-zinc-900 mb-2">
                                        {result.score >= 80 ? t('recruitment.excellentMatch') : result.score >= 60 ? t('recruitment.goodPotential') : t('recruitment.weakMatch')}
                                    </h3>
                                    <p className="text-zinc-600 leading-relaxed text-[13px] italic">
                                        "{result.summary}"
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white rounded-lg p-5">
                                    <h4 className="text-zinc-900 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" /> {t('recruitment.matchedSkills')}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.matched_skills?.map((skill, i) => (
                                            <span key={i} className="bg-zinc-100 text-zinc-900 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border border-zinc-200">{skill}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-5">
                                    <h4 className="text-zinc-900 text-[12px] font-black uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <XCircle className="w-3.5 h-3.5 text-red-600" /> {t('recruitment.missingRequirements')}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missing_skills?.map((skill, i) => (
                                            <span key={i} className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border border-red-100">{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button onClick={onClose} className="w-full py-2.5 bg-white border border-zinc-300 text-zinc-700 text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-zinc-50 transition-colors">
                                {t('recruitment.closeAnalysis')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecruitmentPage;
