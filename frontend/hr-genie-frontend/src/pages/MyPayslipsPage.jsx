import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Download, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const MyPayslipsPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState(null);

    useEffect(() => { fetchPayslips(); }, []);

    const fetchPayslips = async () => {
        try {
            const res = await api.get(`/payroll/user/${user.id}`);
            setPayslips(res.data.payrolls || []);
        } catch (err) {
            console.error('Failed to fetch payslips', err);
            toast.error('Failed to load payslips');
        } finally { setLoading(false); }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    const formatDateRange = (start, end) => {
        const s = new Date(start).toLocaleDateString('en', { month: 'short', day: 'numeric' });
        const e = new Date(end).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${s} — ${e}`;
    };

    if (loading) {
        return (<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin" /></div>);
    }

    return (
        <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{t('myPayslips.title')}</h1>
                <p className="text-zinc-500 text-sm">{t('myPayslips.subtitle')}</p>
            </div>
            {payslips.length === 0 ? (
                <div className="card h-64 flex flex-col items-center justify-center text-zinc-500">
                    <FileText className="w-10 h-10 mb-4 text-zinc-300" />
                    <p className="text-[16px] font-bold text-zinc-900">{t('myPayslips.noPayslips')}</p>
                    <p className="text-[13px] mt-1">{t('myPayslips.payslipsWillAppear')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {payslips.map((slip) => (
                        <div key={slip.id} onClick={() => setSelectedSlip(selectedSlip?.id === slip.id ? null : slip)} className="card p-5 cursor-pointer hover:border-[#C4BDFF] transition-colors group">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-zinc-100 border border-zinc-200 rounded-full flex items-center justify-center shrink-0">
                                        <DollarSign className="w-4 h-4 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-bold text-zinc-900">{formatDateRange(slip.pay_period_start, slip.pay_period_end)}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${slip.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{slip.status === 'paid' ? t('common.paid') : t('common.pending')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[16px] font-bold text-zinc-900">{formatCurrency(slip.net_salary)}</p>
                                    <p className="text-[12px] text-zinc-500">{t('myPayslips.netPay')}</p>
                                </div>
                            </div>
                            {selectedSlip?.id === slip.id && (
                                <div className="mt-5 pt-5 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn">
                                    <DetailItem icon={DollarSign} label={t('myPayslips.baseSalary')} value={formatCurrency(slip.base_salary)} color="text-zinc-900" />
                                    <DetailItem icon={TrendingUp} label={t('myPayslips.bonus')} value={formatCurrency(slip.bonus)} color="text-zinc-900" />
                                    <DetailItem icon={TrendingDown} label={t('myPayslips.taxDeduction')} value={formatCurrency(slip.tax_deduction)} color="text-zinc-600" />
                                    <DetailItem icon={Calendar} label={t('myPayslips.processed')} value={new Date(slip.created_at).toLocaleDateString()} color="text-zinc-600" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ icon: Icon, label, value, color }) => (
    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-md">
        <div className="flex items-center gap-1.5 mb-1">
            <Icon className="w-3 h-3 text-zinc-400" />
            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{label}</p>
        </div>
        <p className={`text-[13px] font-bold ${color}`}>{value}</p>
    </div>
);

export default MyPayslipsPage;
