import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, Send, CheckCircle, ArrowLeft, Building2, Bot } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CareersPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [formData, setFormData] = useState({ applicant_name: '', email: '', resume: null });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await axios.get(`${API_URL}/careers/jobs`);
            setJobs(res.data.jobs || []);
        } catch (err) {
            console.error('Failed to fetch open positions', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const data = new FormData();
            data.append('applicant_name', formData.applicant_name);
            data.append('email', formData.email);
            if (formData.resume) {
                data.append('resume', formData.resume);
            }

            await axios.post(`${API_URL}/careers/jobs/${selectedJob.id}/apply`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || t('careers.failedToSubmit'));
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedJob(null);
        setFormData({ applicant_name: '', email: '', resume: null });
        setSubmitted(false);
        setError('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
        );
    }

    // Success State
    if (submitted) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <div className="bg-white border border-zinc-200 rounded-md max-w-md w-full p-10 text-center animate-fadeIn shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">{t('careers.applicationSubmitted')}</h2>
                    <p className="text-zinc-600 mb-2">
                        {t('careers.thankYouApplying')} <strong className="text-zinc-900">{selectedJob.title}</strong>.
                    </p>
                    <p className="text-zinc-500 text-sm mb-8">
                        {t('careers.hrReviewMessage')}
                    </p>
                    <button
                        onClick={resetForm}
                        className="w-full bg-zinc-900 text-white py-3 rounded-md font-bold hover:bg-zinc-800 transition-colors"
                    >
                        {t('careers.browseOther')}
                    </button>
                </div>
            </div>
        );
    }

    // Application Form
    if (selectedJob) {
        return (
            <div className="min-h-screen bg-zinc-50 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={resetForm}
                        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8 transition-colors font-bold text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('careers.backToAll')}
                    </button>

                    <div className="bg-white border border-zinc-200 rounded-md overflow-hidden animate-fadeIn shadow-sm">
                        {/* Job Header */}
                        <div className="bg-zinc-900 p-8">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
                                <Building2 className="w-4 h-4" />
                                {selectedJob.department_name || 'General'}
                            </div>
                            <h1 className="text-2xl font-black text-white mb-2 tracking-tight">{selectedJob.title}</h1>
                            <p className="text-zinc-400 text-sm font-medium">
                                {t('careers.posted')} {new Date(selectedJob.created_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>

                        {/* Job Details */}
                        {(selectedJob.description || selectedJob.requirements) && (
                            <div className="p-8 border-b border-zinc-200">
                                {selectedJob.description && (
                                    <div className="mb-6">
                                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">{t('careers.aboutTheRole')}</h3>
                                        <p className="text-zinc-700 whitespace-pre-line leading-relaxed">{selectedJob.description}</p>
                                    </div>
                                )}
                                {selectedJob.requirements && (
                                    <div>
                                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">{t('careers.requirements')}</h3>
                                        <p className="text-zinc-700 whitespace-pre-line leading-relaxed">{selectedJob.requirements}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Application Form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <h3 className="text-lg font-bold text-zinc-900">{t('careers.applyForPosition')}</h3>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-1.5">{t('careers.fullName')}</label>
                                <input
                                    type="text"
                                    value={formData.applicant_name}
                                    onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                                    placeholder={t('careers.yourFullName')}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-1.5">{t('careers.emailLabel')}</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                                    placeholder="your.email@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-1.5">{t('careers.resumeCv')}</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={(e) => setFormData({ ...formData, resume: e.target.files[0] })}
                                    className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                                />
                                <p className="text-xs text-zinc-500 mt-1">{t('careers.maxFileSize')}</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-zinc-900 text-white py-3.5 rounded-md font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Send className="w-5 h-5" />
                                {submitting ? t('careers.submitting') : t('careers.submitApplication')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Jobs Listing
    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Hero */}
            <div className="text-center pt-16 pb-12 px-4 bg-white border-b border-zinc-200">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-zinc-900 rounded-md flex items-center justify-center">
                        <Bot className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">HR Genie</h1>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
                    {t('careers.joinOurTeam')}
                </h2>
                <p className="text-lg text-zinc-500 max-w-xl mx-auto">
                    {t('careers.lookingForTalent')}
                </p>
            </div>

            {/* Jobs List */}
            <div className="max-w-3xl mx-auto px-4 py-12 pb-20">
                {jobs.length > 0 ? (
                    <div className="space-y-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4">
                            {t('careers.openPositions', { count: jobs.length })}
                        </p>
                        {jobs.map(job => (
                            <div
                                key={job.id}
                                onClick={() => setSelectedJob(job)}
                                className="bg-white border border-zinc-200 rounded-md p-6 hover:border-zinc-400 transition-colors cursor-pointer group shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-md group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-colors">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-zinc-900 group-hover:text-zinc-700 transition-colors">
                                                {job.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-zinc-500 font-medium">
                                                {job.department_name && (
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        {job.department_name}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(job.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            {job.description && (
                                                <p className="mt-3 text-sm text-zinc-500 line-clamp-2">{job.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-zinc-400 group-hover:text-zinc-900 transition-colors text-sm font-bold whitespace-nowrap mt-1">
                                        {t('careers.applyArrow')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Briefcase className="w-16 h-16 mx-auto mb-4 text-zinc-200" />
                        <h3 className="text-xl font-black text-zinc-900 mb-2">{t('careers.noOpenPositions')}</h3>
                        <p className="text-zinc-500">
                            {t('careers.checkBackSoon')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CareersPage;
