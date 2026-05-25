import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DollarSign, FileText, CheckCircle, Clock, Download, Zap, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import PayrollModal from '../components/modals/PayrollModal';
import PayslipModal from '../components/modals/PayslipModal';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

const PayrollPage = () => {
    const toast = useToast();
    const { t } = useTranslation();
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [isUpdating, setIsUpdating] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [confirmPayId, setConfirmPayId] = useState(null);

    // Month navigation: 0 = current month, -1 = last month, etc.
    const [monthOffset, setMonthOffset] = useState(0);

    const getMonthRange = () => {
        const d = new Date();
        d.setMonth(d.getMonth() + monthOffset);
        const y = d.getFullYear();
        const m = d.getMonth();
        const from = new Date(y, m, 1).toISOString().split('T')[0];
        const to = new Date(y, m + 1, 0).toISOString().split('T')[0];
        const label = new Date(y, m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        return { from, to, label };
    };

    useEffect(() => {
        fetchPayrolls();
    }, [monthOffset]);

    const fetchPayrolls = async () => {
        try {
            const { from, to } = getMonthRange();
            const res = await api.get('/payroll', { params: { from, to } });
            setPayrolls(res.data.payrolls || []);
        } catch (err) {
            console.error('Error fetching payroll', err);
            toast.error('Failed to load payroll data');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (payrollId) => {
        setIsUpdating(payrollId);
        setConfirmPayId(null);
        try {
            await api.put(`/payroll/${payrollId}/pay`, { status: 'paid' });
            setPayrolls(prev =>
                prev.map(pay => pay.id === payrollId ? { ...pay, status: 'paid' } : pay)
            );
            toast.success(t('payroll.payrollMarkedPaid'));
        } catch (err) {
            console.error('Error updating payroll status', err);
            toast.error(err.response?.data?.error || t('payroll.failedToUpdate'));
        } finally {
            setIsUpdating(null);
        }
    };

    const handleExport = async () => {
        try {
            const res = await api.get('/export/payroll', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'payroll_export.csv'; a.click();
            window.URL.revokeObjectURL(url);
            toast.success(t('payroll.payrollCsvDownloaded'));
        } catch { toast.error(t('payroll.exportFailed')); }
    };

    const handleGenerate = async () => {
        try {
            const res = await api.post('/payroll/generate');
            setPayrolls(prev => [...(res.data.payrolls || []), ...prev]);
            toast.success(res.data.message || t('payroll.generated'));
        } catch (err) {
            toast.error(err.response?.data?.error || t('payroll.generationFailed'));
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin" />
        </div>
    );

    // Summary stats computed from loaded data
    const totalPending = payrolls
        .filter(p => p.status === 'pending')
        .reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const totalPaidThisMonth = payrolls
        .filter(p => p.status === 'paid' && p.pay_period_end?.slice(0, 7) === thisMonth)
        .reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
    const uniqueEmployees = new Set(payrolls.map(p => p.user_id)).size;

    const filteredPayrolls = filterStatus === 'all' ? payrolls : payrolls.filter(p => p.status === filterStatus);

    return (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('payroll.title')}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">{t('common.exportCsv')}</span>
                    </button>
                    <button
                        onClick={() => setIsPayrollModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <DollarSign className="w-4 h-4" />
                        {t('payroll.runPayroll')}
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-zinc-200 rounded-md p-5">
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">Pending Payout</p>
                    <p className="text-2xl font-black text-amber-600">${totalPending.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">{payrolls.filter(p => p.status === 'pending').length} pending entries</p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-md p-5">
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">Paid This Month</p>
                    <p className="text-2xl font-black text-emerald-600">${totalPaidThisMonth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">{payrolls.filter(p => p.status === 'paid' && p.pay_period_end?.slice(0, 7) === thisMonth).length} payslips</p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-md p-5">
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">Employees</p>
                    <p className="text-2xl font-black text-zinc-900">{uniqueEmployees}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">on payroll</p>
                </div>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-md px-5 py-3">
                <button onClick={() => setMonthOffset(o => o - 1)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                    <ChevronLeft className="w-5 h-5 text-zinc-600" />
                </button>
                <div className="text-center">
                    <p className="text-[15px] font-black text-zinc-900">{getMonthRange().label}</p>
                    {monthOffset !== 0 && (
                        <button onClick={() => setMonthOffset(0)} className="text-[11px] text-zinc-400 hover:text-zinc-700 font-bold uppercase tracking-wider mt-0.5">
                            Back to current
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setMonthOffset(o => o + 1)}
                    disabled={monthOffset >= 0}
                    className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                </button>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3">
                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Filter:</p>
                {['all', 'pending', 'paid'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1.5 rounded-md text-[12px] font-bold uppercase tracking-wider transition-colors border ${
                            filterStatus === s
                                ? 'bg-[#5B4FE8] text-white border-[#5B4FE8]'
                                : 'bg-white text-zinc-500 border-zinc-200 hover:border-[#5B4FE8]'
                        }`}
                    >
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
                <span className="text-[12px] text-zinc-400 ml-auto">{filteredPayrolls.length} record{filteredPayrolls.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Desktop Table */}
            <div className="card p-0 overflow-hidden hidden md:block">
                <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
                    <h2 className="text-[14px] font-bold text-zinc-900">{t('payroll.recentPayrolls')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-white">
                                <th className="py-3 px-5 text-left text-[12px] font-bold text-zinc-500 uppercase tracking-wider">{t('common.employee')}</th>
                                <th className="py-3 px-5 text-right text-[12px] font-bold text-zinc-500 uppercase tracking-wider">{t('payroll.baseSalary')}</th>
                                <th className="py-3 px-5 text-right text-[12px] font-bold text-zinc-500 uppercase tracking-wider">{t('payroll.bonuses')}</th>
                                <th className="py-3 px-5 text-right text-[12px] font-bold text-zinc-500 uppercase tracking-wider">{t('payroll.netSalary')}</th>
                                <th className="py-3 px-5 text-center text-[12px] font-bold text-zinc-500 uppercase tracking-wider">{t('payroll.period')}</th>
                                <th className="py-3 px-5 text-left text-[12px] font-bold text-zinc-500 uppercase tracking-wider">{t('common.status')}</th>
                                <th className="py-3 px-5 text-right text-[12px] font-bold text-zinc-500 uppercase tracking-wider">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {filteredPayrolls.map(pay => (
                                <tr key={pay.id} className="bg-white hover:bg-zinc-50 transition-colors">
                                    <td className="py-3.5 px-5 font-bold text-zinc-900 text-[13px]">{pay.employee_name}</td>
                                    <td className="py-3.5 px-5 text-right text-[13px] text-zinc-600">${parseFloat(pay.base_salary).toLocaleString()}</td>
                                    <td className="py-3.5 px-5 text-right text-[13px] text-zinc-600">${parseFloat(pay.bonus).toLocaleString()}</td>
                                    <td className="py-3.5 px-5 text-right text-[13px] font-bold text-zinc-900">${parseFloat(pay.net_salary).toLocaleString()}</td>
                                    <td className="py-3.5 px-5 text-center text-zinc-500 text-[12px]">{new Date(pay.pay_period_start).toLocaleDateString()} – {new Date(pay.pay_period_end).toLocaleDateString()}</td>
                                    <td className="py-3.5 px-5">
                                        {pay.status === 'paid' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">
                                                <CheckCircle className="w-3 h-3" /> {t('common.paid')}
                                            </span>
                                        ) : confirmPayId === pay.id ? (
                                            <div className="flex items-center gap-1.5 animate-fadeIn">
                                                <span className="text-[11px] text-zinc-500 font-medium">Confirm?</span>
                                                <button
                                                    onClick={() => handleMarkAsPaid(pay.id)}
                                                    disabled={isUpdating === pay.id}
                                                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                                >
                                                    <Check className="w-3 h-3" /> Yes, paid
                                                </button>
                                                <button
                                                    onClick={() => setConfirmPayId(null)}
                                                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                                                    <Clock className="w-3 h-3" /> {t('common.pending')}
                                                </span>
                                                <button
                                                    onClick={() => setConfirmPayId(pay.id)}
                                                    disabled={isUpdating === pay.id}
                                                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#5B4FE8] rounded-md hover:bg-[#4a3fd4] transition-colors disabled:opacity-50 whitespace-nowrap uppercase tracking-wider"
                                                >
                                                    {isUpdating === pay.id ? t('common.updating') : t('payroll.markPaid')}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-5 text-right">
                                        <button
                                            onClick={() => setSelectedPayslip(pay)}
                                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                                            title="View Payslip"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPayrolls.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-zinc-500 text-[13px]">{t('payroll.noPayrollRecords')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                <h2 className="text-[14px] font-bold text-zinc-900">{t('payroll.recentPayrolls')}</h2>
                {filteredPayrolls.length === 0 ? (
                    <div className="card p-8 text-center text-zinc-500 text-[13px]">{t('payroll.noPayrollRecords')}</div>
                ) : (
                    filteredPayrolls.map(pay => (
                        <div key={pay.id} className="card p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-zinc-900 font-bold text-[14px]">{pay.employee_name}</span>
                                {pay.status === 'paid' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider"><CheckCircle className="w-3 h-3" /> {t('common.paid')}</span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider"><Clock className="w-3 h-3" /> {t('common.pending')}</span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-zinc-500 mb-0.5 tracking-wider">{t('payroll.base')}</p>
                                    <p className="text-zinc-600 text-[13px]">${parseFloat(pay.base_salary).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-zinc-500 mb-0.5 tracking-wider">{t('payroll.net')}</p>
                                    <p className="text-zinc-900 font-bold text-[13px]">${parseFloat(pay.net_salary).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-zinc-500 mb-0.5 tracking-wider">{t('payroll.bonus')}</p>
                                    <p className="text-zinc-600 text-[13px]">${parseFloat(pay.bonus).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-zinc-500 mb-0.5 tracking-wider">{t('payroll.period')}</p>
                                    <p className="text-zinc-500 text-[12px]">{new Date(pay.pay_period_start).toLocaleDateString()} – {new Date(pay.pay_period_end).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
                                {pay.status !== 'paid' && (
                                    <button onClick={() => setConfirmPayId(pay.id)} disabled={isUpdating === pay.id}
                                        className="flex-1 py-1.5 text-[12px] font-bold uppercase tracking-wider text-white bg-[#5B4FE8] rounded-md hover:bg-[#4a3fd4] transition-colors disabled:opacity-50">
                                        {isUpdating === pay.id ? t('common.updating') : t('payroll.markAsPaid')}
                                    </button>
                                )}
                                <button onClick={() => setSelectedPayslip(pay)}
                                    className="p-1.5 text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-md hover:bg-zinc-200 transition-colors flex items-center justify-center" title="View Payslip">
                                    <FileText className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <PayrollModal isOpen={isPayrollModalOpen} onClose={() => setIsPayrollModalOpen(false)} onPayrollAdded={(newPayroll) => setPayrolls([newPayroll, ...payrolls])} />
            <PayslipModal isOpen={!!selectedPayslip} onClose={() => setSelectedPayslip(null)} payroll={selectedPayslip} />
        </div>
    );
};

export default PayrollPage;
