import React from 'react';
import { X, DollarSign, Building2, Calendar, User, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PayslipModal = ({ isOpen, onClose, payroll }) => {
    if (!isOpen || !payroll) return null;
    const { t } = useTranslation();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="modal-overlay animate-fadeIn print:bg-white print:static print:p-0">
            <div className="modal-panel animate-slideUp print:shadow-none print:border-none print:w-full print:max-w-none">

                {/* Header (Hidden when printing) */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-100 print:hidden">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-zinc-100 border border-zinc-200 rounded-md">
                            <FileText className="w-4 h-4 text-zinc-600" />
                        </div>
                        <h2 className="text-[16px] font-bold text-zinc-900">{t('payslipModal.title')}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-zinc-700 bg-white hover:bg-zinc-50 rounded-md transition-colors border border-zinc-200"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {t('payslipModal.printPdf')}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Printable Payslip Content */}
                <div className="p-8 print:p-0">
                    {/* Payslip Header */}
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-zinc-100">
                        <div>
                            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{t('payslipModal.payslip')}</h2>
                            <p className="text-[13px] font-medium text-zinc-500 mt-0.5">
                                {t('payslipModal.period')}: {formatDate(payroll.pay_period_start)} - {formatDate(payroll.pay_period_end)}
                            </p>
                            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${payroll.status === 'paid' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}>
                                {payroll.status}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-[13px] font-medium text-zinc-600">ID: #{payroll.id.toString().padStart(6, '0')}</p>
                            <p className="text-[12px] text-zinc-400 mt-0.5">{t('payslipModal.generated')}: {formatDate(Date.now())}</p>
                        </div>
                    </div>

                    {/* Employee Info */}
                    <div className="bg-zinc-50 p-4 rounded-md border border-zinc-200 mb-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-full border border-zinc-200">
                                <User className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                                <p className="text-[14px] font-bold text-zinc-900">{payroll.employee_name}</p>
                                <p className="text-[13px] text-zinc-500">{payroll.email || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Earnings & Deductions Table */}
                    <div className="border border-zinc-200 rounded-md overflow-hidden mb-6">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-4 py-3 text-[12px] font-bold text-zinc-700 uppercase tracking-wider">{t('payslipModal.descriptionCol')}</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-zinc-700 uppercase tracking-wider text-right">{t('payslipModal.earnings')}</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-zinc-700 uppercase tracking-wider text-right">{t('payslipModal.deductions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                <tr>
                                    <td className="px-4 py-3 text-[13px] text-zinc-900 font-medium">{t('payslipModal.baseSalary')}</td>
                                    <td className="px-4 py-3 text-[13px] text-zinc-900 text-right">{formatCurrency(payroll.base_salary)}</td>
                                    <td className="px-4 py-3 text-[13px] text-zinc-900 text-right">-</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-[13px] text-zinc-900 font-medium">{t('payslipModal.performanceBonus')}</td>
                                    <td className="px-4 py-3 text-[13px] text-zinc-900 text-right">{formatCurrency(payroll.bonus)}</td>
                                    <td className="px-4 py-3 text-[13px] text-zinc-900 text-right">-</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-[13px] text-zinc-900 font-medium">{t('payslipModal.taxDeductions')}</td>
                                    <td className="px-4 py-3 text-[13px] text-zinc-900 text-right">-</td>
                                    <td className="px-4 py-3 text-[13px] text-red-600 text-right font-medium">{formatCurrency(payroll.tax_deduction)}</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-zinc-50 border-t border-zinc-200">
                                <tr>
                                    <td className="px-4 py-3 text-[13px] font-bold text-zinc-900">{t('payslipModal.grossTotals')}</td>
                                    <td className="px-4 py-3 text-[13px] font-bold text-zinc-900 text-right">
                                        {formatCurrency(parseFloat(payroll.base_salary) + parseFloat(payroll.bonus))}
                                    </td>
                                    <td className="px-4 py-3 text-[13px] font-bold text-red-600 text-right">
                                        {formatCurrency(payroll.tax_deduction)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Net Total Summary */}
                    <div className="flex justify-end">
                        <div className="bg-[#1A1D23] rounded-md p-5 w-full sm:w-64 text-white">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-zinc-400 text-[13px] font-medium">{t('payslipModal.totalEarnings')}</span>
                                <span className="text-[13px] font-semibold">{formatCurrency(parseFloat(payroll.base_salary) + parseFloat(payroll.bonus))}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-zinc-700">
                                <span className="text-zinc-400 text-[13px] font-medium">{t('payslipModal.totalDeductions')}</span>
                                <span className="text-[13px] font-semibold text-red-400">-{formatCurrency(payroll.tax_deduction)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-white text-[14px]">{t('payslipModal.netPay')}</span>
                                <span className="text-2xl font-black tracking-tight flex items-center gap-0.5">
                                    <DollarSign className="w-5 h-5 opacity-80" />
                                    {parseFloat(payroll.net_salary).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Create a dummy import for FileText as it was missing from the lucide-react import
import { FileText } from 'lucide-react';

export default PayslipModal;
