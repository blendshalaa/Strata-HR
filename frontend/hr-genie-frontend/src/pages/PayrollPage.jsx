import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DollarSign, FileText, CheckCircle, Clock, Download, Zap } from 'lucide-react';
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

    useEffect(() => {
        fetchPayrolls();
    }, []);

    const fetchPayrolls = async () => {
        try {
            const res = await api.get('/payroll');
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
        try {
            await api.put(`/payroll/${payrollId}/pay`, { status: 'paid' });
            setPayrolls(prev =>
                prev.map(pay => pay.id === payrollId ? { ...pay, status: 'paid' } : pay)
            );
            toast.success('Payroll marked as paid');
        } catch (err) {
            console.error('Error updating payroll status', err);
            toast.error(err.response?.data?.error || 'Failed to update status');
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
            toast.success('Payroll CSV downloaded');
        } catch { toast.error('Export failed'); }
    };

    const handleGenerate = async () => {
        try {
            const res = await api.post('/payroll/generate');
            setPayrolls(prev => [...(res.data.payrolls || []), ...prev]);
            toast.success(res.data.message || 'Payroll generated from timesheets');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Generation failed');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('payroll.title')}</h1>
                    <p className="text-zinc-500 text-sm mt-1">{t('payroll.subtitle')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">{t('common.exportCsv')}</span>
                    </button>
                    <button onClick={handleGenerate} className="btn-secondary flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4" /> {t('payroll.fromTimesheets')}
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
                            {payrolls.map(pay => (
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
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                                                    <Clock className="w-3 h-3" /> {t('common.pending')}
                                                </span>
                                                <button
                                                    onClick={() => handleMarkAsPaid(pay.id)}
                                                    disabled={isUpdating === pay.id}
                                                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 whitespace-nowrap uppercase tracking-wider"
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
                            {payrolls.length === 0 && (
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
                {payrolls.length === 0 ? (
                    <div className="card p-8 text-center text-zinc-500 text-[13px]">{t('payroll.noPayrollRecords')}</div>
                ) : (
                    payrolls.map(pay => (
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
                                    <button onClick={() => handleMarkAsPaid(pay.id)} disabled={isUpdating === pay.id}
                                        className="flex-1 py-1.5 text-[12px] font-bold uppercase tracking-wider text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50">
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
