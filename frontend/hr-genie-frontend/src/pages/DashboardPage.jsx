import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, leaveAPI } from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import TimeClockWidget from '../components/dashboard/TimeClockWidget';
import MobileDashboard from '../components/dashboard/MobileDashboard';
import useIsMobile from '../hooks/useIsMobile';
import {
  MessageSquare,
  Calendar,
  TrendingUp,
  ArrowRight,
  Briefcase,
  Users,
  Building2,
  Sparkles,
  CheckCircle2,
  Circle,
  Trophy,
  Clock,
  AlertOctagon,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  X
} from 'lucide-react';
import api from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const DashboardPage = () => {
  const { user, isHR } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, balanceRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        leaveAPI.getBalance()
      ]);
      setStats(dashboardRes.data);
      setBalance(balanceRes.data.balance);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#EEF0FF] border-t-[#5B4FE8] rounded-full animate-spin" />
      </div>
    );
  }

  if (isMobile) {
    return <MobileDashboard stats={stats} balance={balance} user={user} isHR={isHR} />;
  }

  const tooltipStyle = {
    backgroundColor: '#fff',
    border: '0.5px solid rgba(0,0,0,0.08)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(91,79,232,0.08)',
    fontSize: '13px',
    color: '#0F0D2E',
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="rounded-lg p-6 sm:p-8" style={{ backgroundColor: '#5B4FE8', border: '0.5px solid rgba(91,79,232,0.3)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold mb-1.5 tracking-tight text-white">
              {t('dashboard.welcomeBack', { name: user?.name?.split(' ')[0] })}
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {t('dashboard.whatsHappening')}
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="hidden sm:flex shrink-0 items-center gap-2 bg-white px-4 py-2 rounded-md font-semibold hover:bg-[#F5F4FF] transition-colors text-sm"
            style={{ color: '#5B4FE8' }}
          >
            <Sparkles className="w-4 h-4" />
            {t('dashboard.askAiAssistant')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Onboarding Checklist for Everyone */}
      <OnboardingWidget />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isHR && (
          <StatsCard icon={MessageSquare} title={t('dashboard.totalConversations')} value={stats?.stats?.total_conversations || 0} subtitle={t('dashboard.activeChats')} color="primary" />
        )}
        <StatsCard icon={Calendar} title={t('dashboard.sickLeaveBalance')} value={balance?.sick_leave_balance || 0} subtitle={t('common.daysRemaining')} color="green" />
        <StatsCard icon={Calendar} title={t('dashboard.vacationBalance')} value={balance?.vacation_balance || 0} subtitle={t('common.daysRemaining')} color="purple" />
        {isHR && (
          <>
            <StatsCard icon={Briefcase} title={t('dashboard.openPositions')} value={stats?.stats?.open_positions || 0} subtitle={t('dashboard.activelyRecruiting')} color="amber" />
            <StatsCard icon={Users} title={t('dashboard.headcount')} value={stats?.stats?.total_users || 42} subtitle={t('dashboard.totalEmployees')} color="green" />
          </>
        )}
      </div>

      {/* Main Content */}
      {isHR ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-900">{t('dashboard.headcountByDept')}</h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">{t('dashboard.currentDistribution')}</p>
              </div>
              <Users className="w-5 h-5 text-zinc-400" />
            </div>
            {stats?.department_headcount?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.department_headcount}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} stroke="#94a3b8" allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#5B4FE8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{t('dashboard.noDepartmentData')}</p>
                </div>
              </div>
            )}
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-900">{t('dashboard.chatActivity')}</h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">{t('dashboard.last7Days')}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-zinc-400" />
            </div>
            {stats?.chat_activity?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.chat_activity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke="#5B4FE8" strokeWidth={2.5} dot={{ fill: '#5B4FE8', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, stroke: '#5B4FE8', strokeWidth: 2, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{t('dashboard.noActivityYet')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Employee Left Column: TimeClock + Pending Actions */}
          <div className="lg:col-span-8 space-y-6">
            <TimeClockWidget />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Needs Your Attention */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-[14px] font-bold text-zinc-900">{t('dashboard.needsYourAttention')}</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/documents')}
                    className={`w-full flex items-center justify-between p-3 rounded-md border transition-colors group ${
                      stats?.stats?.pending_documents > 0
                        ? 'bg-rose-50 border-rose-200 hover:border-rose-300'
                        : 'bg-zinc-50 border-zinc-200 hover:border-[#5B4FE8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldAlert className={`w-4 h-4 ${stats?.stats?.pending_documents > 0 ? 'text-rose-600' : 'text-zinc-400'}`} />
                      <span className="text-[13px] font-medium text-zinc-900">{t('dashboard.signDocuments')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] font-black ${stats?.stats?.pending_documents > 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
                        {stats?.stats?.pending_documents ?? 0}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/goals')}
                    className={`w-full flex items-center justify-between p-3 rounded-md border transition-colors group bg-zinc-50 border-zinc-200 hover:border-[#5B4FE8]`}
                  >
                    <div className="flex items-center gap-3">
                      <Trophy className="w-4 h-4 text-zinc-400" />
                      <span className="text-[13px] font-medium text-zinc-900">{t('dashboard.activeGoals')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black text-zinc-400">
                        {stats?.stats?.active_goals ?? 0}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Training Overview */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5B4FE8]" />
                    <h3 className="text-[14px] font-bold text-zinc-900">{t('dashboard.trainingAndDocs')}</h3>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/training')}
                  className={`w-full h-[120px] rounded-md border flex flex-col items-center justify-center transition-colors group ${
                    stats?.stats?.pending_trainings > 0
                      ? 'bg-[#EEF0FF] border-[#5B4FE8] hover:bg-[#E5E8FF]'
                      : 'bg-zinc-50 border-zinc-200 hover:border-[#5B4FE8]'
                  }`}
                >
                  <span className={`text-3xl font-black mb-2 ${stats?.stats?.pending_trainings > 0 ? 'text-[#5B4FE8]' : 'text-zinc-400'}`}>
                    {stats?.stats?.pending_trainings ?? 0}
                  </span>
                  <span className={`text-[12px] font-semibold uppercase tracking-wider ${stats?.stats?.pending_trainings > 0 ? 'text-[#5B4FE8]' : 'text-zinc-400'}`}>
                    {t('dashboard.assignedTraining')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Employee Right Column: Upcoming Shifts */}
          <div className="lg:col-span-4">
            <div className="card h-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[14px] font-bold text-zinc-900">{t('dashboard.upcomingShifts')}</h3>
                  <p className="text-[12px] text-zinc-500 mt-0.5">{t('dashboard.yourSchedule')}</p>
                </div>
                <Calendar className="w-4 h-4 text-zinc-400" />
              </div>
              
              <div className="space-y-3">
                {stats?.upcoming_shifts?.length > 0 ? (
                  stats.upcoming_shifts.map((shift, idx) => {
                    const start = new Date(shift.start_time);
                    const end = new Date(shift.end_time);
                    const isToday = start.toDateString() === new Date().toDateString();
                    
                    return (
                      <div key={shift.id || idx} className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 flex flex-col gap-2 relative overflow-hidden group hover:border-[#5B4FE8] transition-colors">
                        {isToday && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#5B4FE8]"></div>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-bold text-zinc-900">
                            {isToday ? 'Today' : start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${isToday ? 'bg-[#EEF0FF] text-[#5B4FE8]' : 'bg-zinc-200/50 text-zinc-500'}`}>
                            {shift.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {shift.notes && (
                           <p className="text-[11px] text-zinc-400 italic mt-1 border-t border-zinc-200/50 pt-1.5 line-clamp-1">{shift.notes}</p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center flex flex-col items-center">
                    <Calendar className="w-8 h-8 text-zinc-300 mb-2" />
                    <p className="text-[13px] font-semibold text-zinc-500">{t('dashboard.noUpcomingShifts')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Risk Analytics */}
      {isHR && <FlightRiskWidget />}

      {/* HR Attention + Attendance Today */}
      {isHR && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Needs Your Attention */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-amber-50 rounded-md border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-zinc-900">Needs Your Attention</h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">Pending items requiring action</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/leave/approvals')}
                className={`w-full flex items-center justify-between p-3 rounded-md border transition-all hover:shadow-sm group ${
                  stats?.stats?.pending_leave_requests > 0
                    ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                    : 'bg-zinc-50 border-zinc-200 hover:border-[#C4BDFF]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className={`w-4 h-4 ${stats?.stats?.pending_leave_requests > 0 ? 'text-amber-600' : 'text-zinc-400'}`} />
                  <span className="text-[13px] font-medium text-zinc-900">Pending Leave Requests</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-black ${
                    stats?.stats?.pending_leave_requests > 0 ? 'text-amber-700' : 'text-zinc-400'
                  }`}>{stats?.stats?.pending_leave_requests ?? 0}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
              <button
                onClick={() => navigate('/timesheets/approvals')}
                className={`w-full flex items-center justify-between p-3 rounded-md border transition-all hover:shadow-sm group ${
                  stats?.stats?.pending_timesheets > 0
                    ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                    : 'bg-zinc-50 border-zinc-200 hover:border-[#C4BDFF]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className={`w-4 h-4 ${stats?.stats?.pending_timesheets > 0 ? 'text-amber-600' : 'text-zinc-400'}`} />
                  <span className="text-[13px] font-medium text-zinc-900">Pending Timesheet Approvals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-black ${
                    stats?.stats?.pending_timesheets > 0 ? 'text-amber-700' : 'text-zinc-400'
                  }`}>{stats?.stats?.pending_timesheets ?? 0}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Attendance Today */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-emerald-50 rounded-md border border-emerald-200">
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-zinc-900">Attendance Today</h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div>
                <span className="text-4xl font-black text-zinc-900">{stats?.stats?.attendance_today ?? 0}</span>
                <span className="text-lg font-bold text-zinc-400 ml-1">/ {stats?.stats?.total_users ?? 0}</span>
              </div>
              <span className="text-[12px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">clocked in</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#EEF0FF' }}>
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${stats?.stats?.total_users > 0 ? Math.round((stats.stats.attendance_today / stats.stats.total_users) * 100) : 0}%` }}
              />
            </div>
            <p className="text-[12px] text-zinc-400 font-medium">
              {stats?.stats?.total_users > 0
                ? `${Math.round((( stats.stats.attendance_today ?? 0) / stats.stats.total_users) * 100)}% attendance rate today`
                : 'No employee data'}
            </p>
          </div>
        </div>
      )}

      {/* Knowledge Base Preview */}
      {stats?.stats?.total_knowledge_articles > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[14px] font-semibold text-zinc-900">{t('dashboard.knowledgeBaseTitle')}</h3>
            <button onClick={() => navigate('/knowledge')} className="text-[13px] font-semibold transition-colors" style={{ color: '#5B4FE8' }}>
              {t('common.viewAll')} &rarr;
            </button>
          </div>
          <p className="text-zinc-500 text-[13px]">
            {t('dashboard.accessArticles', { count: stats.stats.total_knowledge_articles })}
          </p>
        </div>
      )}
    </div>
  );
};

// Flight Risk Widget Component — Manual Trigger Only
const FlightRiskWidget = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [risks, setRisks] = useState(null);
  const [error, setError] = useState(null);

  const fetchRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/flight-risk');
      setRisks(res.data.high_risk_employees || []);
    } catch (err) {
      setError(t('dashboard.failedToLoadAnalytics') || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  if (risks === null) {
    return (
      <div className="card border-zinc-200 bg-white flex flex-col items-center justify-center p-8 text-center min-h-48 mt-6">
        <div className="p-3 rounded-full mb-4" style={{ backgroundColor: '#EEF0FF' }}>
          <Sparkles className="w-6 h-6" style={{ color: '#5B4FE8' }} />
        </div>
        <h3 className="text-[15px] font-bold text-zinc-900 mb-2">{t('dashboard.predictiveRetention')}</h3>
        <p className="text-[13px] text-zinc-500 mb-5 max-w-sm">
          Run an on-demand AI analysis to identify potential flight risks and retention flags based on employee data.
        </p>
        <button 
          onClick={fetchRisk} 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-zinc-200 border-t-white rounded-full animate-spin mr-2" /> {t('dashboard.analyzingRetention')}</>
          ) : (
            'Run AI Analysis'
          )}
        </button>
      </div>
    );
  }

  if (error || risks.length === 0) {
    return (
      <div className="card border-zinc-200 bg-white flex flex-col items-center justify-center p-8 text-center min-h-48 mt-6">
        <p className="text-[13px] text-zinc-500">{error || 'No high-risk employees identified at this time.'}</p>
        <button onClick={() => setRisks(null)} className="mt-4 text-[13px] font-semibold hover:underline" style={{ color: '#5B4FE8' }}>Reset Analysis</button>
      </div>
    );
  }

  return (
    <div className="card border-rose-200 bg-rose-50/30 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-rose-100/50 rounded-md border border-rose-200/50">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-zinc-900 flex items-center gap-2">
            {t('dashboard.predictiveRetention')}
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-400" /> {t('dashboard.aiAnalysis')}
            </span>
          </h3>
          <p className="text-[13px] text-zinc-500 mt-0.5">{t('dashboard.flightRiskDesc')}</p>
        </div>
        <button onClick={() => setRisks(null)} className="ml-auto text-[12px] text-zinc-500 hover:text-zinc-900 font-medium">
          Dismiss
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {risks.map((risk, idx) => (
          <div key={idx} className="bg-white border border-rose-200/60 rounded-md p-4 transition-colors hover:border-rose-300 group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-zinc-900 font-semibold text-[14px]">{risk.name}</h4>
                <span className="text-zinc-500 text-[12px]">{risk.department}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${risk.risk_level?.toLowerCase() === 'high'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                {risk.risk_level} {t('dashboard.risk')}
              </span>
            </div>
            <div className="text-[13px] text-zinc-600 leading-relaxed pt-3 border-t border-zinc-100 relative mt-2">
              <ShieldAlert className="w-4 h-4 text-rose-300 absolute -top-2.5 bg-white right-0 group-hover:text-rose-500 transition-colors" />
              {risk.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Onboarding Widget Component
const OnboardingWidget = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('onboarding_dismissed') === 'true';
  });
  const [autoDismissing, setAutoDismissing] = useState(false);

  useEffect(() => {
    if (!dismissed) fetchTasks();
  }, [dismissed]);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/onboarding');
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to load onboarding tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (taskId) => {
    try {
      const res = await api.put(`/onboarding/${taskId}`);
      const updated = tasks.map(t => t.id === taskId ? res.data.task : t);
      setTasks(updated);
      // Auto-dismiss 3s after all tasks complete
      const allDone = updated.every(t => t.is_completed);
      if (allDone) {
        setAutoDismissing(true);
        setTimeout(() => handleDismiss(), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle task status', err);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('onboarding_dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed || loading) return null;
  if (tasks.length === 0) return null;

  const completed = tasks.filter(t => t.is_completed).length;
  const progress = Math.round((completed / tasks.length) * 100);
  const isAllDone = completed === tasks.length;

  return (
    <div className="card mb-6 relative">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
        title="Dismiss permanently"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pr-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md" style={{ backgroundColor: isAllDone ? '#FFF8EB' : '#EEF0FF' }}>
            <Trophy className="w-4 h-4" style={{ color: isAllDone ? '#B45309' : '#5B4FE8' }} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-zinc-900 flex items-center gap-2 mb-0.5">
              {t('dashboard.welcomeOnboard')}
              {isAllDone && <span className="text-[10px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">{t('common.completed')}</span>}
            </h3>
            <p className="text-[13px] text-zinc-500">
              {autoDismissing
                ? 'All done! Dismissing in a moment…'
                : isAllDone
                ? t('dashboard.completedAllTasks')
                : t('dashboard.letsGetSetUp')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold text-zinc-900 leading-none">{progress}%</div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 mt-1 font-semibold">{t('common.progress')}</p>
          </div>
          <div className="h-1.5 w-full md:w-32 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: '#EEF0FF' }}>
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%`, backgroundColor: isAllDone ? '#059669' : '#5B4FE8' }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => handleToggle(task.id)}
            className={`flex items-center gap-3 p-3 rounded-md border transition-colors text-left ${task.is_completed
              ? 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
              : 'bg-white border-zinc-300 hover:border-[#5B4FE8]'
              }`}
          >
            {task.is_completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-zinc-400 shrink-0" />
            )}
            <span className={`text-[13px] font-medium ${task.is_completed ? 'line-through text-zinc-400' : 'text-zinc-700'}`}>
              {task.task_name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;