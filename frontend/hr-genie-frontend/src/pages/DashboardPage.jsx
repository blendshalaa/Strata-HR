import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, leaveAPI } from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import {
  MessageSquare,
  Calendar,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Briefcase,
  Users,
  Building2,
  Sparkles,
  CheckCircle2,
  Circle,
  Trophy,
  Play,
  Square,
  Clock,
  AlertOctagon,
  ShieldAlert
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
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  const quickActions = [
    { label: t('dashboard.askAiAssistant'), desc: t('dashboard.getInstantAnswers'), icon: MessageSquare, route: '/chat', color: 'primary' },
    { label: t('dashboard.requestLeave'), desc: t('dashboard.submitNewLeave'), icon: Calendar, route: '/leave', color: 'emerald' },
    { label: t('dashboard.browsePolicies'), desc: t('dashboard.viewPolicies'), icon: BookOpen, route: '/knowledge', color: 'purple' },
  ];

  const hrActions = [
    { label: t('dashboard.manageUsers'), desc: t('dashboard.viewManageAccounts'), icon: Users, route: '/users', color: 'blue' },
    { label: t('dashboard.manageDepartments'), desc: t('dashboard.organizeTeams'), icon: Building2, route: '/departments', color: 'indigo' },
  ];

  const renderActionButton = (action) => {
    return (
      <button
        key={action.route}
        onClick={() => navigate(action.route)}
        className="w-full flex items-center gap-3 p-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition-all text-left group"
      >
        <div className="p-2 bg-zinc-100 rounded-md border border-zinc-200/50">
          <action.icon className="w-4 h-4 text-zinc-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-zinc-900 text-[13px]">{action.label}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{action.desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
      </button>
    );
  };

  const tooltipStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontSize: '13px',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="border border-zinc-200 rounded-lg bg-zinc-900 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold mb-1.5 tracking-tight">
              {t('dashboard.welcomeBack', { name: user?.name?.split(' ')[0] })}
            </h1>
            <p className="text-zinc-400 text-sm">
              {t('dashboard.whatsHappening')}
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="hidden sm:flex shrink-0 items-center gap-2 bg-white text-zinc-900 px-4 py-2 rounded-md font-medium hover:bg-zinc-100 transition-colors border border-transparent text-sm"
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

      {/* Main Content Grid */}
      <div className={`grid grid-cols-1 ${isHR ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
        {!isHR && (
          <div className="lg:col-span-1">
            <TimeClockWidget />
          </div>
        )}
        {isHR && (
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
                  <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
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
        )}

        {isHR && (
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
                  <Line type="monotone" dataKey="count" stroke="#18181b" strokeWidth={2.5} dot={{ fill: '#18181b', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, stroke: '#18181b', strokeWidth: 2, fill: '#fff' }} />
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
        )}

        {/* Quick Actions */}
        <div className={`card ${!isHR ? 'lg:col-span-2' : ''}`}>
          <h3 className="text-[14px] font-semibold text-zinc-900 mb-4">{t('dashboard.quickActions')}</h3>
          <div className={`space-y-2.5 ${!isHR ? 'grid grid-cols-1 sm:grid-cols-3 gap-4 space-y-0' : ''}`}>
            {quickActions.map(renderActionButton)}
            {isHR && hrActions.map(renderActionButton)}
          </div>
        </div>
      </div>

      {/* Flight Risk Analytics */}
      {isHR && <FlightRiskWidget />}

      {/* Knowledge Base Preview */}
      {stats?.stats?.total_knowledge_articles > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[14px] font-semibold text-zinc-900">{t('dashboard.knowledgeBaseTitle')}</h3>
            <button onClick={() => navigate('/knowledge')} className="text-[13px] text-zinc-500 hover:text-zinc-900 font-medium transition-colors">
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
        <div className="p-3 bg-zinc-100 rounded-full mb-4 border border-zinc-200">
          <Sparkles className="w-6 h-6 text-zinc-900" />
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
        <button onClick={() => setRisks(null)} className="mt-4 text-[13px] text-zinc-900 font-semibold hover:underline">Reset Analysis</button>
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

  useEffect(() => {
    fetchTasks();
  }, []);

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
      setTasks(tasks.map(t => t.id === taskId ? res.data.task : t));
    } catch (err) {
      console.error('Failed to toggle task status', err);
    }
  };

  if (loading) return null;
  if (tasks.length === 0) return null;

  const completed = tasks.filter(t => t.is_completed).length;
  const progress = Math.round((completed / tasks.length) * 100);
  const isAllDone = completed === tasks.length;

  return (
    <div className="card mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 rounded-md border border-zinc-200">
            <Trophy className={`w-4 h-4 ${isAllDone ? 'text-amber-500' : 'text-zinc-500'}`} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-zinc-900 flex items-center gap-2 mb-0.5">
              {t('dashboard.welcomeOnboard')}
              {isAllDone && <span className="text-[10px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">{t('common.completed')}</span>}
            </h3>
            <p className="text-[13px] text-zinc-500">
              {isAllDone ? t('dashboard.completedAllTasks') : t('dashboard.letsGetSetUp')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold text-zinc-900 leading-none">{progress}%</div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 mt-1 font-semibold">{t('common.progress')}</p>
          </div>
          <div className="h-1.5 w-full md:w-32 bg-zinc-100 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-zinc-900 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
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
              : 'bg-white border-zinc-300 hover:border-zinc-400'
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

// Time Clock Widget
const TimeClockWidget = () => {
  const { t } = useTranslation();
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    let interval;
    if (activeShift) {
      interval = setInterval(() => {
        const start = new Date(activeShift.clock_in).getTime();
        const now = new Date().getTime();
        const diff = now - start;

        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
        const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');

        setElapsed(`${h}:${m}:${s}`);
      }, 1000);
    } else {
      setElapsed('00:00:00');
    }
    return () => clearInterval(interval);
  }, [activeShift]);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/attendance/me');
      const latest = res.data.timesheets[0];
      if (latest && !latest.clock_out) {
        setActiveShift(latest);
      } else {
        setActiveShift(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePunch = async () => {
    try {
      setLoading(true);
      if (activeShift) {
        await api.post('/attendance/clock-out');
        setActiveShift(null);
      } else {
        const res = await api.post('/attendance/clock-in');
        setActiveShift(res.data.timesheet);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !activeShift && elapsed === '00:00:00') {
    return <div className="card h-full flex items-center justify-center"><div className="w-5 h-5 border-2 border-zinc-900 rounded-full animate-spin border-t-transparent" /></div>;
  }

  const isClockedIn = !!activeShift;

  return (
    <div className={`card h-full flex flex-col items-center justify-center p-8 transition-colors ${isClockedIn ? 'bg-zinc-50 border-zinc-200' : ''}`}>
      <div className="mb-2 text-center">
        <h3 className="text-zinc-900 font-bold text-[16px] mb-1">{isClockedIn ? t('dashboard.shiftInProgress') : t('dashboard.readyToWork')}</h3>
        <p className="text-zinc-500 text-[13px]">{isClockedIn ? 'Click "Clock Out" when you finish your shift' : 'Click "Clock In" to start tracking your work hours'}</p>
      </div>

      <div className={`text-4xl sm:text-5xl font-black tabular-nums tracking-tight my-6 ${isClockedIn ? 'text-emerald-600' : 'text-zinc-400'}`}>
        {elapsed}
      </div>

      <button
        onClick={handlePunch}
        disabled={loading}
        className={`w-full max-w-[200px] flex items-center justify-center gap-2 py-3.5 rounded-md font-semibold text-sm transition-all ${isClockedIn
          ? 'bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-100'
          : 'bg-zinc-900 text-white border border-transparent hover:bg-zinc-800'
          }`}
      >
        {isClockedIn ? (
          <>
            <Square className="w-4 h-4 fill-current" /> Clock Out
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" /> Clock In
          </>
        )}
      </button>

      <div className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-zinc-500">
        <Clock className="w-3.5 h-3.5" />
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
};

export default DashboardPage;