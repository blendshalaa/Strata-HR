import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel, confirmVariant = 'danger', loading = false }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const variants = {
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        primary: 'bg-zinc-900 hover:bg-zinc-800 text-white',
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/40 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white border border-zinc-200 rounded-lg max-w-sm w-full shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-50 border border-red-100 rounded-md shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-bold text-zinc-900 mb-1">{title || t('common.confirm')}</h3>
                            <p className="text-[13px] text-zinc-600 leading-relaxed">{message}</p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-md transition-colors shrink-0">
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-100 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-md transition-colors disabled:opacity-50 ${variants[confirmVariant]}`}
                    >
                        {loading ? t('common.loading') : (confirmLabel || t('common.confirm'))}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
