import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TrendingUp, Star, Calendar as CalendarIcon, MessageSquare, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EvaluationModal from '../components/modals/EvaluationModal';
import { useToast } from '../context/ToastContext';
import GoalsPage from './GoalsPage';
import { useTranslation } from 'react-i18next';

const TABS = [
    { key: 'reviews', label: 'performance.reviews' },
    { key: 'goals', label: 'performance.goalsAndOkrs' },
];

const PerformancePage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('reviews');
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);

    useEffect(() => {
        if (user && user.id) {
            fetchReviews(user.id);
        }
    }, [user]);

    const fetchReviews = async (userId) => {
        try {
            const res = await api.get(`/performance/user/${userId}`);
            setReviews(res.data.reviews || []);
        } catch (err) {
            console.error('Failed to fetch reviews', err);
            toast.error('Failed to load performance reviews');
        } finally {
            setLoading(false);
        }
    };

    if (loading && activeTab === 'reviews') return (
        <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('performance.title')}</h1>
                    <p className="text-zinc-500 text-sm mt-1">{t('performance.subtitle')}</p>
                </div>
                {activeTab === 'reviews' && (user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
                    <button
                        onClick={() => setIsEvalModalOpen(true)}
                        className="px-4 py-2 bg-zinc-900 text-white text-[13px] font-bold uppercase tracking-wider rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-2"
                    >
                        <TrendingUp className="w-4 h-4" />
                        {t('performance.newEvaluation')}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-md w-fit border border-zinc-200">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-md text-[13px] font-bold transition-all ${
                            activeTab === tab.key
                                ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                                : 'text-zinc-500 hover:text-zinc-700 border border-transparent'
                        }`}
                    >
                        {t(tab.label)}
                    </button>
                ))}
            </div>

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {reviews.map(review => (
                        <div key={review.id} className="card bg-white border border-zinc-200 flex flex-col hover:border-zinc-300 transition-colors relative overflow-hidden p-6">
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-md">
                                        <Star className="w-4 h-4 text-zinc-900 fill-zinc-900" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900 text-[14px]">Performance Review</h3>
                                        <div className="flex items-center gap-0.5 mt-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-zinc-900 fill-zinc-900' : 'text-zinc-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center text-[11px] font-bold text-zinc-400 uppercase tracking-wider gap-1">
                                        <CalendarIcon className="w-3 h-3" />
                                        {new Date(review.review_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 mb-6">
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 mt-1 flex-shrink-0" />
                                    <p className="text-[13px] text-zinc-600 italic leading-relaxed">"{review.comments}"</p>
                                </div>
                            </div>
                            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pt-4 border-t border-zinc-100">
                                {t('performance.reviewedBy')} <span className="text-zinc-900">{review.reviewer_name || t('performance.systemUser')}</span>
                            </div>
                        </div>
                    ))}
                    {reviews.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white border border-zinc-200 rounded-lg">
                            <Star className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                            <p className="text-zinc-500 text-[13px] font-bold uppercase tracking-wider">{t('performance.noReviews')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && <GoalsPage embedded />}

            <EvaluationModal isOpen={isEvalModalOpen} onClose={() => setIsEvalModalOpen(false)} onEvaluationAdded={(newEval) => setReviews([newEval, ...reviews])} />
        </div>
    );
};

export default PerformancePage;
