import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { BarChart3, TrendingUp, Users, BriefcaseBusiness, DollarSign, PieChart, Clock, Shield } from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart as RPieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';

const CHART_COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#09090b', '#27272a', '#52525b'];

const chartTooltipStyle = {
    contentStyle: { background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '6px', color: '#18181b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' },
    labelStyle: { color: '#71717a', fontWeight: 'black', marginBottom: '4px' }
};

const formatCurrency = (v) => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
    return `$${v}`;
};

const StatCard = ({ icon: Icon, label, value, sub }) => (
    <div className="bg-white border border-zinc-200 rounded-md p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-md">
                <Icon className="w-5 h-5 text-zinc-600" />
            </div>
        </div>
        <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[28px] font-black text-zinc-900 leading-tight tracking-tight">{value}</p>
            {sub && <p className="text-[11px] font-bold text-zinc-500 mt-2">{sub}</p>}
        </div>
    </div>
);

const ChartCard = ({ title, subtitle, children, className = '' }) => (
    <div className={`bg-white border border-zinc-200 rounded-md p-6 shadow-sm ${className}`}>
        <div className="mb-6">
            <h3 className="text-[14px] font-black text-zinc-900 uppercase tracking-widest">{title}</h3>
            {subtitle && <p className="text-[12px] font-bold text-zinc-500 mt-1">{subtitle}</p>}
        </div>
        {children}
    </div>
);

const ReportsPage = () => {
    const toast = useToast();
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await api.get('/analytics/reports');
                setData(res.data);
            } catch {
                toast.error(t('reports.failedToLoad'));
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) return <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider text-center mt-12">{t('reports.noReportData')}</p>;

    const { headcount, leave, payroll, departments, recruitment, tenure, roles } = data;

    const totalLeave = leave.by_status.reduce((s, r) => s + r.count, 0);
    const approvedLeave = leave.by_status.find(r => r.status === 'approved')?.count || 0;
    const approvalRate = totalLeave > 0 ? Math.round((approvedLeave / totalLeave) * 100) : 0;
    const totalPayroll = payroll.trends.reduce((s, r) => s + r.total_net, 0);

    const leaveStatusColors = { approved: '#3f3f46', pending: '#a1a1aa', rejected: '#ef4444' };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1 flex items-center gap-2">
                    {t('reports.title')}
                </h1>
                <p className="text-zinc-500 text-sm">{t('reports.subtitle')}</p>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label={t('reports.totalHeadcount')} value={headcount.current} />
                <StatCard icon={Clock} label={t('reports.leaveApprovalRate')} value={`${approvalRate}%`} sub={`${approvedLeave} of ${totalLeave} requests`} />
                <StatCard icon={DollarSign} label={t('reports.totalPayroll6mo')} value={formatCurrency(totalPayroll)} />
                <StatCard icon={BriefcaseBusiness} label={t('reports.openPositions')} value={recruitment?.open_positions || 0} sub={`${recruitment?.total_applications || 0} total applications`} />
            </div>

            {/* Row 1: Headcount Trend + Department Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={t('reports.headcountTrend')} subtitle={t('reports.headcountTrendSub')}>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={headcount.trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                            <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} tickLine={false} />
                            <YAxis tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                            <Tooltip {...chartTooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', color: '#71717a', textTransform: 'uppercase' }} />
                            <Area type="monotone" dataKey="cumulative" name="Total Employees" stroke="#18181b" fill="#18181b" fillOpacity={0.05} strokeWidth={2} />
                            <Bar dataKey="new_hires" name="New Hires" fill="#a1a1aa" barSize={16} radius={[4, 4, 0, 0]} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t('reports.departmentHeadcount')} subtitle={t('reports.departmentHeadcountSub')}>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={departments} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                            <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#3f3f46', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} width={100} />
                            <Tooltip {...chartTooltipStyle} />
                            <Bar dataKey="headcount" name="Employees" radius={[0, 4, 4, 0]} barSize={20}>
                                {departments.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Row 2: Leave Trends + Leave Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title={t('reports.leaveTrends')} subtitle={t('reports.leaveTrendsSub')} className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={leave.trends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                            <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} tickLine={false} />
                            <YAxis tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                            <Tooltip {...chartTooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', color: '#71717a', textTransform: 'uppercase' }} />
                            <Bar dataKey="sick" name="Sick" fill="#71717a" stackId="a" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="vacation" name="Vacation" fill="#18181b" stackId="a" />
                            <Bar dataKey="personal" name="Personal" fill="#d4d4d8" stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t('reports.leaveByStatus')} subtitle={t('reports.leaveByStatusSub')}>
                    <ResponsiveContainer width="100%" height={280}>
                        <RPieChart>
                            <Pie data={leave.by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={90} strokeWidth={2} stroke="#ffffff">
                                {leave.by_status.map((entry, i) => (
                                    <Cell key={i} fill={leaveStatusColors[entry.status] || CHART_COLORS[i]} />
                                ))}
                            </Pie>
                            <Tooltip {...chartTooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', color: '#71717a', textTransform: 'uppercase' }} />
                        </RPieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Row 3: Payroll Trends */}
            <ChartCard title={t('reports.payrollTrends')} subtitle={t('reports.payrollTrendsSub')}>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={payroll.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                        <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                        <Tooltip {...chartTooltipStyle} formatter={(v) => formatCurrency(v)} />
                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', color: '#71717a', textTransform: 'uppercase' }} />
                        <Line type="monotone" dataKey="total_base" name="Base Salary" stroke="#18181b" strokeWidth={2} dot={{ fill: '#18181b', r: 4 }} />
                        <Line type="monotone" dataKey="total_net" name="Net Pay" stroke="#71717a" strokeWidth={2} dot={{ fill: '#71717a', r: 4 }} />
                        <Line type="monotone" dataKey="total_bonus" name="Bonuses" stroke="#d4d4d8" strokeWidth={2} dot={{ fill: '#d4d4d8', r: 4 }} />
                        <Line type="monotone" dataKey="total_tax" name="Tax Deductions" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#ef4444', r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Row 4: Recruitment Pipeline + Dept Avg Salary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={t('reports.recruitmentPipeline')} subtitle={t('reports.recruitmentPipelineSub')}>
                    {recruitment && (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={[
                                { stage: 'Applied', count: parseInt(recruitment.new_applications) },
                                { stage: 'Interviewing', count: parseInt(recruitment.interviewing) },
                                { stage: 'Hired', count: parseInt(recruitment.hired) },
                                { stage: 'Rejected', count: parseInt(recruitment.rejected) },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                                <XAxis dataKey="stage" tick={{ fill: '#3f3f46', fontSize: 11, fontWeight: 'bold' }} tickLine={false} />
                                <YAxis tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                                <Tooltip {...chartTooltipStyle} />
                                <Bar dataKey="count" name="Applications" radius={[4, 4, 0, 0]} barSize={40}>
                                    {['#71717a', '#a1a1aa', '#18181b', '#ef4444'].map((c, i) => <Cell key={i} fill={c} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard title={t('reports.avgSalaryByDept')} subtitle={t('reports.avgSalaryByDeptSub')}>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={departments.filter(d => d.avg_salary > 0)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                            <XAxis dataKey="name" tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 'bold' }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                            <YAxis tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                            <Tooltip {...chartTooltipStyle} formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="avg_salary" name="Avg Salary" radius={[4, 4, 0, 0]} barSize={36}>
                                {departments.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Row 5: Tenure + Role Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={t('reports.tenureDistribution')} subtitle={t('reports.tenureDistributionSub')}>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={tenure}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                            <XAxis dataKey="bucket" tick={{ fill: '#3f3f46', fontSize: 11, fontWeight: 'bold' }} tickLine={false} />
                            <YAxis tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                            <Tooltip {...chartTooltipStyle} />
                            <Bar dataKey="count" name="Employees" fill="#18181b" radius={[4, 4, 0, 0]} barSize={36} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t('reports.roleDistribution')} subtitle={t('reports.roleDistributionSub')}>
                    <ResponsiveContainer width="100%" height={260}>
                        <RPieChart>
                            <Pie data={roles} dataKey="count" nameKey="role" cx="50%" cy="50%" innerRadius={50} outerRadius={85} strokeWidth={2} stroke="#ffffff" label={({ role, count }) => `${role} (${count})`}>
                                {roles.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip {...chartTooltipStyle} />
                        </RPieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
};

export default ReportsPage;
