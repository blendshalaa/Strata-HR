import React, { useState } from 'react';
import { X, PenTool, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const SignDocumentModal = ({ isOpen, onClose, document, onSigned }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const { user } = useAuth();
    
    const [signatureText, setSignatureText] = useState('');
    const [signing, setSigning] = useState(false);

    if (!isOpen || !document) return null;

    const handleSign = async (e) => {
        e.preventDefault();
        if (!signatureText.trim()) {
            toast.error('Please type your name to sign');
            return;
        }
        
        if (signatureText.trim().toLowerCase() !== user.name.toLowerCase()) {
            toast.error('Please type your exact full name as it appears in the system');
            return;
        }

        setSigning(true);
        try {
            const res = await api.post(`/documents/${document.id}/sign`, {
                signature_text: signatureText.trim()
            });
            toast.success('Document successfully signed');
            onSigned(res.data.document);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to sign document');
        } finally {
            setSigning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
                    <div className="flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-[#5B4FE8]" />
                        <h2 className="text-[15px] font-bold text-zinc-900">E-Sign Document</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-md transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 p-4 bg-[#EEF0FF] border border-[#C4BDFF] rounded-md">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-[#5B4FE8] shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[13px] font-semibold text-zinc-900 mb-1">Electronic Signature Agreement</p>
                                <p className="text-[12px] text-zinc-600 leading-relaxed">
                                    By typing your name below, you acknowledge that you have read and agree to the contents of 
                                    <span className="font-bold text-zinc-900 mx-1">"{document.name}"</span>. 
                                    This electronic signature carries the same legal weight as a physical signature.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSign}>
                        <div className="mb-6">
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Type your full name to sign</label>
                            <input 
                                type="text" 
                                value={signatureText}
                                onChange={e => setSignatureText(e.target.value)}
                                placeholder={user.name}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-300 font-serif text-lg outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all focus:bg-white"
                                required
                            />
                            <p className="text-[11px] text-zinc-400 mt-2">
                                Your IP address and a secure cryptographic hash will be recorded with this signature.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-5 py-2 text-[13px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={signing || !signatureText.trim()}
                                className="bg-[#5B4FE8] hover:bg-[#4a3fd4] text-white px-6 py-2 rounded-md font-bold text-[13px] transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {signing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PenTool className="w-4 h-4" />}
                                {signing ? 'Signing...' : 'Sign & Agree'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignDocumentModal;
