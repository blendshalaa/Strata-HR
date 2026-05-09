import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { BarChart3, TrendingUp, Users, BriefcaseBusiness, DollarSign, PieChart, Clock, Shield } from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart as RPieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';

const CHART_COLORS = ['#5B4FE8', '#7B6EF0', '#A89CFF', '#C4BDFF', '#059669', '#B45309', '#DC2626', '#3730a3'];

const chartTooltipStyle = {
    contentStyle: { background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: '#0F0D2E', fontSize: '13px', boxShadow: '0 4px 16px rgba(91,79,232,0.08)' },
    labelStyle: { color: '#6B7280', fontWeight: '600', marginBottom: '4px' }
};

const formatCurrency = (v) => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
    return `$${v}`;
};

const StatCard = ({ icon: Icon, label, value, sub }) => (
    <div className="card">
        <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>{label}</p>
            <div className="p-2 rounded-md flex-shrink-0" style={{ backgroundColor: '#EEF0FF' }}>
                <Icon className="w-4 h-4" style={{ color: '#5B4FE8' }} />
            </div>
        </div>
        <p className="text-[28px] font-bold tracking-tight leading-none" style={{ color: '#0F0D2E' }}>{value}</p>
        {sub && <p className="text-[12px] mt-2" style={{ color: '#9CA3AF' }}>{sub}</p>}
    </div>
);

const ChartCard = ({ title, subtitle, children, className = '' }) => (
    <div className={`card ${className}`}>
        <div className="mb-5">
            <h3 className="text-[15px] font-semibold" style={{ color: '#0F0D2E' }}>{title}</h3>
            {subtitle && <p className="text-[13px] mt-0.5" style={{ color: '#6B7280' }}>{subtitle}</p>}
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
                <div className="w-6 h-6 border-2 border-[#EEF0FF] border-t-[#5B4FE8] rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) return <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider text-center mt-12">{t('reports.noReportData')}</p>;

    const { headcount, leave, payroll, departments, recruitment, tenure, roles } = data;

    const totalLeave = leave.by_status.reduce((s, r) => s + r.count, 0);
    const approvedLeave = leave.by_status.find(r => r.status === 'approved')?.count || 0;
    const approvalRate = totalLeave > 0 ? Math.round((approvedLeave / totalLeave) * 100) : 0;
    const totalPayroll = payroll.trends.reduce((s, r) => s + r.total_net, 0);

    const leaveStatusColors = { approved: '#5B4FE8', pending: '#A89CFF', rejected: '#DC2626' };

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
                            <Area type="monotone" dataKey="cumulative" name="Total Employees" stroke="#5B4FE8" fill="#5B4FE8" fillOpacity={0.06} strokeWidth={2} />
                            <Bar dataKey="new_hires" name="New Hires" fill="#C4BDFF" barSize={16} radius={[4, 4, 0, 0]} />
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
                            <Bar dataKey="sick" name="Sick" fill="#A89CFF" stackId="a" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="vacation" name="Vacation" fill="#5B4FE8" stackId="a" />
                            <Bar dataKey="personal" name="Personal" fill="#EEF0FF" stackId="a" radius={[4, 4, 0, 0]} />
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
                        <Line type="monotone" dataKey="total_base" name="Base Salary" stroke="#5B4FE8" strokeWidth={2} dot={{ fill: '#5B4FE8', r: 4 }} />
                        <Line type="monotone" dataKey="total_net" name="Net Pay" stroke="#A89CFF" strokeWidth={2} dot={{ fill: '#A89CFF', r: 4 }} />
                        <Line type="monotone" dataKey="total_bonus" name="Bonuses" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 4 }} />
                        <Line type="monotone" dataKey="total_tax" name="Tax Deductions" stroke="#DC2626" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#DC2626', r: 3 }} />
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
                                    {['#5B4FE8', '#A89CFF', '#059669', '#DC2626'].map((c, i) => <Cell key={i} fill={c} />)}
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
                            <Bar dataKey="count" name="Employees" fill="#5B4FE8" radius={[4, 4, 0, 0]} barSize={36} />
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
