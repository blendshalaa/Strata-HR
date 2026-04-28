import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fadeIn">
            <div className="relative mb-8">
                <div className="w-28 h-28 bg-zinc-100 border border-zinc-200 rounded-md flex items-center justify-center">
                    <SearchX className="w-14 h-14 text-zinc-300" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 border border-red-200 rounded-md flex items-center justify-center">
                    <span className="text-red-600 text-xs font-black">!</span>
                </div>
            </div>

            <h1 className="text-5xl font-black text-zinc-900 mb-2 tracking-tight">{t('notFound.title')}</h1>
            <p className="text-lg text-zinc-600 mb-1 font-bold">{t('notFound.pageNotFound')}</p>
            <p className="text-sm text-zinc-500 max-w-md mb-8">
                {t('notFound.description')}
            </p>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-5 py-2.5 border border-zinc-200 rounded-md text-sm text-zinc-700 hover:bg-zinc-50 transition-colors font-bold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('common.goBack')}
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-md text-sm font-bold hover:bg-zinc-800 transition-colors"
                >
                    <Home className="w-4 h-4" />
                    {t('notFound.dashboard')}
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;
