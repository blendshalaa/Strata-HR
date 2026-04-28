import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Building2, Shield, Briefcase } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

const EmployeeDirectoryPage = () => {
    const toast = useToast();
    const { t } = useTranslation();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');

    useEffect(() => { fetchEmployees(); }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users/directory');
            setEmployees(res.data.users || []);
        } catch (err) {
            toast.error('Failed to load employee directory');
        } finally { setLoading(false); }
    };

    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
    const filtered = employees.filter(e => {
        const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
        const matchesDept = !deptFilter || e.department === deptFilter;
        return matchesSearch && matchesDept;
    });

    const roleBadge = {
        admin: 'bg-rose-50 text-rose-700 border-rose-200',
        hr: 'bg-violet-50 text-violet-700 border-violet-200',
        employee: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };

    if (loading) {
        return (<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" /></div>);
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{t('directory.title')}</h1>
                <p className="text-zinc-500 text-sm">{t('directory.subtitle')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="text" placeholder={t('directory.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm" />
                </div>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm">
                    <option value="">{t('directory.allDepartments')}</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <p className="text-[12px] text-zinc-500">{filtered.length === 1 ? t('directory.employeeFound', { count: filtered.length }) : t('directory.employeesFound', { count: filtered.length })}</p>
            {filtered.length === 0 ? (
                <div className="bg-white border border-dashed border-zinc-300 rounded-lg h-48 flex flex-col items-center justify-center text-zinc-400">
                    <Users className="w-8 h-8 mb-3 text-zinc-300" />
                    <p className="font-medium text-zinc-600 text-[14px]">{t('directory.noEmployees')}</p>
                    <p className="text-[13px] mt-0.5">{t('directory.tryAdjusting')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(emp => (
                        <div key={emp.id} className="card p-4 transition-all hover:border-zinc-300 group">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-zinc-100 border border-zinc-200 rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-[15px] font-semibold text-zinc-700">{emp.name?.charAt(0)?.toUpperCase()}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-[14px] font-semibold text-zinc-900 truncate">{emp.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-zinc-500">
                                        <Mail className="w-3 h-3 shrink-0 text-zinc-400" />
                                        <span className="truncate">{emp.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        {emp.department && (
                                            <span className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-zinc-500 border border-zinc-200 bg-zinc-50 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                                                <Building2 className="w-2.5 h-2.5 shrink-0" />{emp.department}
                                            </span>
                                        )}
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge[emp.role]}`}>
                                            <Shield className="w-2.5 h-2.5 shrink-0" />{emp.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmployeeDirectoryPage;
