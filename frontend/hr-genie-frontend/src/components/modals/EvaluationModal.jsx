import React, { useState, useEffect } from 'react';
import { X, Star, Sparkles, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const EvaluationModal = ({ isOpen, onClose, onEvaluationAdded }) => {
    const [userId, setUserId] = useState('');
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');
    const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setUserId('');
            setRating(0);
            setComments('');
            setReviewDate(new Date().toISOString().split('T')[0]);
            setError(null);
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.users || []);
        } catch (err) {
            console.error('Failed to fetch users for evaluation modal', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError(t('evaluationModal.provideRating'));
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const newEvaluation = {
                user_id: userId,
                rating,
                comments,
                review_date: reviewDate,
                evaluation_criteria: {
                    communication: rating,
                    teamwork: rating,
                    productivity: rating
                }
            };

            const res = await api.post('/performance', newEvaluation);
            onEvaluationAdded(res.data.review);
            onClose();
        } catch (err) {
            console.error('Failed to create evaluation', err);
            setError(err.response?.data?.error || t('evaluationModal.failedGenerate'));
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDraft = async () => {
        if (!userId) {
            setError(t('evaluationModal.selectEmployeeFirst'));
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const res = await api.post('/performance/generate-draft', { user_id: userId });
            const { rating, comments } = res.data;

            // Apply AI suggestions
            if (rating) setRating(rating);
            if (comments) setComments(comments);

        } catch (err) {
            setError(t('evaluationModal.failedGenerate') + ' ' + (err.response?.data?.error || ''));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStarClick = (index) => {
        setRating(index + 1);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fadeIn">
            <div className="modal-panel animate-slideUp">
                <div className="flex items-center justify-between p-5 border-b border-zinc-100 flex-shrink-0">
                    <h2 className="text-[16px] font-bold text-zinc-900">{t('evaluationModal.title')}</h2>
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
                            {t('common.employee')} <span className="text-zinc-400">*</span>
                        </label>
                        <select
                            required
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                        >
                            <option value="">{t('evaluationModal.selectEmployee')}</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('evaluationModal.overallRating')} <span className="text-zinc-400">*</span>
                        </label>
                        <div className="flex gap-2">
                            {[...Array(5)].map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleStarClick(i)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 ${i < rating ? 'text-zinc-900 fill-zinc-900' : 'text-zinc-200'}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('evaluationModal.reviewDate')} <span className="text-zinc-400">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={reviewDate}
                            onChange={(e) => setReviewDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('evaluationModal.comments')}
                        </label>
                        <textarea
                            rows={4}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none"
                            placeholder={t('evaluationModal.commentsPlaceholder')}
                        />
                    </div>
                    </div>

                    <div className="p-5 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={handleGenerateDraft}
                            disabled={isGenerating || !userId}
                            className={`w-full sm:w-auto flex justify-center items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 text-[13px] font-medium text-zinc-700 rounded-md hover:bg-zinc-100 transition-colors ${(isGenerating || !userId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Generate a draft review using AI based on employee history"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isGenerating ? t('evaluationModal.generating') : t('evaluationModal.autoGenerate')}
                        </button>

                        <div className="flex w-full sm:w-auto items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 sm:flex-none px-4 py-2 text-[13px] font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !userId}
                                className={`flex-1 sm:flex-none px-4 py-2 text-[13px] font-bold text-white bg-[#5B4FE8] border border-[#5B4FE8] rounded-md hover:bg-[#4a3fd4] transition-colors ${(loading || !userId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? t('common.submitting') : t('evaluationModal.submitEvaluation')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

    );
};

export default EvaluationModal;
