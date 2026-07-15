import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const PayrollModal = ({ isOpen, onClose, onPayrollAdded }) => {
    const [userId, setUserId] = useState('');
    const [baseSalary, setBaseSalary] = useState('');
    const [bonus, setBonus] = useState('');
    const [taxDeduction, setTaxDeduction] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setUserId('');
            setBaseSalary('');
            setBonus('');
            setTaxDeduction('');
            setPeriodStart('');
            setPeriodEnd('');
            setError(null);
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.users || []);
        } catch (err) {
            console.error('Failed to fetch users for payroll modal', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const newPayroll = {
                user_id: userId,
                base_salary: parseFloat(baseSalary),
                bonus: parseFloat(bonus || 0),
                tax_deduction: parseFloat(taxDeduction || 0),
                pay_period_start: periodStart,
                pay_period_end: periodEnd
            };

            const res = await api.post('/payroll/calculate', newPayroll);
            onPayrollAdded(res.data.payroll);
            onClose();
        } catch (err) {
            console.error('Failed to create payroll', err);
            setError(err.response?.data?.error || 'An error occurred while creating the payroll record.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fadeIn">
            <div className="modal-panel animate-slideUp">
                <div className="flex items-center justify-between p-5 border-b border-zinc-100 flex-shrink-0">
                    <h2 className="text-[16px] font-bold text-zinc-900">{t('payrollModal.runPayroll')}</h2>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                                {t('payrollModal.baseSalary')} <span className="text-zinc-400">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                value={baseSalary}
                                onChange={(e) => setBaseSalary(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                                placeholder="e.g. 5000"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                                {t('payrollModal.bonus')}
                            </label>
                            <input
                                type="number"
                                value={bonus}
                                onChange={(e) => setBonus(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                                placeholder="e.g. 500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('payrollModal.taxDeduction')}
                        </label>
                        <input
                            type="number"
                            value={taxDeduction}
                            onChange={(e) => setTaxDeduction(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                            placeholder="e.g. 1000"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                                {t('payrollModal.periodStart')} <span className="text-zinc-400">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                                {t('payrollModal.periodEnd')} <span className="text-zinc-400">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[16px] sm:text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                            />
                        </div>
                    </div>
                    </div>

                    <div className="p-5 border-t border-zinc-100 flex items-center justify-end gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-[13px] font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-[13px] font-bold text-white bg-[#111318] border border-[#111318] rounded-md hover:bg-[#374151] transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? t('payrollModal.processing') : t('payrollModal.submitPayroll')}
                        </button>
                    </div>
                </form>
            </div>
        </div>

    );
};

export default PayrollModal;
