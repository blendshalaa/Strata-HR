import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, leaveAPI } from '../services/api';
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
  CheckCircle2,
  Circle,
  Trophy,
  Clock,
  AlertOctagon,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  X,
  Sparkles,
  ChevronRight,
  FileText,
} from 'lucide-react';
import api from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/* ── Skeleton row ────────────────────────────────────────────────────────── */
const SkeletonBar = () => (
  <div className="flex items-stretch border border-[#E5E7EB] rounded-md bg-white overflow-hidden">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex-1 px-4 py-3 border-r border-[#E5E7EB] last:border-r-0 space-y-2">
        <div className="skeleton h-3 w-12 rounded" />
        <div className="skeleton h-5 w-8 rounded" />
      </div>
    ))}
  </div>
);

/* ── Compact stat bar ────────────────────────────────────────────────────── */
const StatBar = ({ stats, balance, isHR }) => {
  const { t } = useTranslation();
  const items = [
    ...(isHR ? [
      { label: 'Headcount',         value: stats?.stats?.total_users ?? '—' },
      { label: 'Pending Leave',      value: stats?.stats?.pending_leave_requests ?? 0, urgent: (stats?.stats?.pending_leave_requests ?? 0) > 0 },
      { label: 'Pending Timesheets', value: stats?.stats?.pending_timesheets ?? 0,      urgent: (stats?.stats?.pending_timesheets ?? 0) > 0 },
      { label: 'Open Positions',     value: stats?.stats?.open_positions ?? 0 },
    ] : [
      { label: 'Sick Leave',         value: `${balance?.sick_leave_balance ?? '—'} days` },
      { label: 'Vacation',           value: `${balance?.vacation_balance ?? '—'} days` },
      { label: 'Pending Documents',  value: stats?.stats?.pending_documents ?? 0, urgent: (stats?.stats?.pending_documents ?? 0) > 0 },
      { label: 'Assigned Training',  value: stats?.stats?.pending_trainings ?? 0 },
    ]),
  ];

  return (
    <div className="flex items-stretch border border-[#E5E7EB] rounded-md bg-white overflow-hidden">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex-1 px-4 py-3"
          style={{ borderRight: i < items.length - 1 ? '1px solid #E5E7EB' : 'none' }}
        >
          <p className="section-label mb-1">{item.label}</p>
          <p
            className="tabular text-[20px] font-medium leading-tight"
            style={{ color: item.urgent ? '#DC2626' : '#111318' }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
};

/* ── Pending action row ──────────────────────────────────────────────────── */
const ActionRow = ({ icon: Icon, label, count, to, urgentThreshold = 1 }) => {
  const navigate = useNavigate();
  const isUrgent = count >= urgentThreshold;
  return (
    <button
      onClick={() => navigate(to)}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded group transition-colors text-left"
      style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7F6'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isUrgent ? '#D97706' : '#9CA3AF' }} />
        <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="tabular text-[13px] font-medium"
          style={{ color: isUrgent ? '#DC2626' : '#6B7280' }}
        >
          {count}
        </span>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: '#D1D5DB' }} />
      </div>
    </button>
  );
};

/* ── Chart tooltip style ─────────────────────────────────────────────────── */
const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: '6px',
  boxShadow: 'none',
  fontSize: '12px',
  color: '#111318',
};

/* ── Time of day helper ──────────────────────────────────────────────────── */
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/* ════════════════════════════════════════════════════════════════════════════ */
const DashboardPage = () => {
  const { user, isHR } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, balRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        leaveAPI.getBalance(),
      ]);
      setStats(dashRes.data);
      setBalance(balRes.data.balance);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isMobile) return <MobileDashboard stats={stats} balance={balance} user={user} isHR={isHR} />;

  /* ── Page ──────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: '500', color: '#111318' }}>
            {user?.name?.split(' ')[0]
              ? `Good ${getTimeOfDay()}, ${user.name.split(' ')[0]}`
              : 'Dashboard'}
          </h1>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="btn-primary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ask AI
        </button>
      </div>

      {/* ── Onboarding checklist ─────────────────────────────────────────── */}
      <OnboardingWidget />

      {/* ── Stat bar ─────────────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonBar />
      ) : (
        <StatBar stats={stats} balance={balance} isHR={isHR} />
      )}

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      {isHR ? (
        <HRDashboard stats={stats} loading={loading} navigate={navigate} />
      ) : (
        <EmployeeDashboard stats={stats} loading={loading} navigate={navigate} />
      )}

      {/* ── Flight risk (HR only) ────────────────────────────────────────── */}
      {isHR && <FlightRiskWidget />}
    </div>
  );
};


/* ── HR main dashboard ───────────────────────────────────────────────────── */
const HRDashboard = ({ stats, loading, navigate }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2].map(i => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-48 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

      {/* Pending actions */}
      <div className="space-y-2">
        <p className="section-label">Needs Action</p>
        <div className="space-y-1.5">
          <ActionRow
            icon={Calendar}
            label="Pending leave requests"
            count={stats?.stats?.pending_leave_requests ?? 0}
            to="/leave-approvals"
          />
          <ActionRow
            icon={Clock}
            label="Timesheet approvals"
            count={stats?.stats?.pending_timesheets ?? 0}
            to="/timesheets"
          />
          <ActionRow
            icon={Briefcase}
            label="Open positions"
            count={stats?.stats?.open_positions ?? 0}
            to="/recruitment"
            urgentThreshold={999}
          />
        </div>

        {/* Attendance today */}
        <div className="card mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="section-label">Attendance today</span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
              {new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="tabular text-[24px] font-medium" style={{ color: '#111318' }}>
              {stats?.stats?.attendance_today ?? 0}
            </span>
            <span className="text-[13px]" style={{ color: '#9CA3AF' }}>
              / {stats?.stats?.total_users ?? 0}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats?.stats?.total_users > 0
                  ? Math.round((stats.stats.attendance_today / stats.stats.total_users) * 100)
                  : 0}%`,
                backgroundColor: '#16A34A',
              }}
            />
          </div>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
            {stats?.stats?.total_users > 0
              ? `${Math.round(((stats.stats.attendance_today ?? 0) / stats.stats.total_users) * 100)}% clocked in`
              : 'No data'}
          </p>
        </div>
      </div>

      {/* Headcount by dept */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="section-label">Headcount by department</p>
          <Users className="w-3.5 h-3.5" style={{ color: '#D1D5DB' }} />
        </div>
        {stats?.department_headcount?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.department_headcount} barSize={16}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" fontSize={11} stroke="#D1D5DB" tickLine={false} axisLine={false} />
              <YAxis fontSize={11} stroke="#D1D5DB" allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(59,91,219,0.04)' }} contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#111318" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center">
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>No department data</p>
          </div>
        )}
      </div>

      {/* AI chat activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="section-label">AI query activity · 7 days</p>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: '#D1D5DB' }} />
        </div>
        {stats?.chat_activity?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.chat_activity}>
              <CartesianGrid strokeDasharray="2 4" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                stroke="#D1D5DB"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#111318"
                strokeWidth={1.5}
                dot={{ fill: '#111318', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: '#111318' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center">
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Employee main dashboard ─────────────────────────────────────────────── */
const EmployeeDashboard = ({ stats, loading, navigate }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-32 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Column: Time clock, Action items, Quick links */}
      <div className="lg:col-span-8 space-y-5">
        <TimeClockWidget />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Action items */}
          <div>
            <p className="section-label mb-2">Needs your attention</p>
            <div className="space-y-1.5">
              <ActionRow
                icon={ShieldAlert}
                label="Documents to sign"
                count={stats?.stats?.pending_documents ?? 0}
                to="/documents"
              />
              <ActionRow
                icon={Trophy}
                label="Active goals"
                count={stats?.stats?.active_goals ?? 0}
                to="/goals"
                urgentThreshold={999}
              />
              <ActionRow
                icon={FileText}
                label="Assigned training"
                count={stats?.stats?.pending_trainings ?? 0}
                to="/training"
                urgentThreshold={999}
              />
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="section-label mb-2">Quick actions</p>
            <div className="space-y-1.5">
              {[
                { label: 'Request leave', to: '/leave' },
                { label: 'Log time', to: '/my-timesheets' },
                { label: 'View payslip', to: '/my-payslips' },
                { label: 'Ask AI assistant', to: '/chat' },
              ].map(link => (
                <button
                  key={link.to}
                  onClick={() => navigate(link.to)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors group"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '13px', color: '#374151' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7F6'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  {link.label}
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: '#D1D5DB' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leave balance summary */}
      <div className="card mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="section-label">Leave balance</span>
          <button
            onClick={() => navigate('/leave')}
            className="text-[11px] font-medium"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={e => e.currentTarget.style.color = '#111318'}
            onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
          >
            Request →
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Vacation</span>
            <span className="tabular" style={{ fontSize: '13px', fontWeight: '500', color: '#111318' }}>
              {stats?.balance?.vacation_balance ?? '—'} days
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Sick leave</span>
            <span className="tabular" style={{ fontSize: '13px', fontWeight: '500', color: '#111318' }}>
              {stats?.balance?.sick_leave_balance ?? '—'} days
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

/* ── Flight Risk Widget ───────────────────────────────────────────────────── */
const FlightRiskWidget = () => {
  const [loading, setLoading] = useState(false);
  const [risks, setRisks] = useState(null);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/flight-risk');
      setRisks(res.data.high_risk_employees || []);
    } catch {
      setError('Failed to load analysis.');
    } finally {
      setLoading(false);
    }
  };

  if (risks === null) {
    return (
      <div className="card flex items-center justify-between gap-4 py-4">
        <div>
          <p style={{ fontSize: '13px', fontWeight: '500', color: '#111318' }}>Predictive retention analysis</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
            Run on-demand AI analysis to identify flight risks based on employee data.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="btn-secondary flex-shrink-0"
          style={{ fontSize: '12px' }}
        >
          {loading ? (
            <><div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" /> Analyzing…</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Run AI Analysis</>
          )}
        </button>
      </div>
    );
  }

  if (error || risks.length === 0) {
    return (
      <div className="card flex items-center justify-between">
        <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{error || 'No high-risk employees identified at this time.'}</p>
        <button onClick={() => setRisks(null)} className="btn-ghost" style={{ fontSize: '12px' }}>Reset</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="section-label">Retention risk analysis</p>
          <span className="chip chip-red">{risks.length} flagged</span>
        </div>
        <button onClick={() => setRisks(null)} className="btn-ghost" style={{ fontSize: '12px' }}>
          <X className="w-3.5 h-3.5" /> Dismiss
        </button>
      </div>

      <div className="table-wrapper">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Risk Level</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk, idx) => (
              <tr key={idx}>
                <td className="font-medium">{risk.name}</td>
                <td>{risk.department}</td>
                <td>
                  <span className={`chip ${risk.risk_level?.toLowerCase() === 'high' ? 'chip-red' : 'chip-amber'}`}>
                    {risk.risk_level}
                  </span>
                </td>
                <td style={{ color: '#6B7280', maxWidth: '360px' }}>{risk.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Onboarding checklist ─────────────────────────────────────────────────── */
const OnboardingWidget = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('onboarding_dismissed') === 'true'
  );

  useEffect(() => { if (!dismissed) fetchTasks(); }, [dismissed]);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/onboarding');
      setTasks(res.data.tasks || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleToggle = async (taskId) => {
    try {
      const res = await api.put(`/onboarding/${taskId}`);
      const updated = tasks.map(t => t.id === taskId ? res.data.task : t);
      setTasks(updated);
      if (updated.every(t => t.is_completed)) {
        setTimeout(() => {
          localStorage.setItem('onboarding_dismissed', 'true');
          setDismissed(true);
        }, 2000);
      }
    } catch { /* silent */ }
  };

  const dismiss = () => {
    localStorage.setItem('onboarding_dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed || loading || tasks.length === 0) return null;

  const completed = tasks.filter(t => t.is_completed).length;
  const progress = Math.round((completed / tasks.length) * 100);

  return (
    <div className="card relative">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded transition-colors"
        style={{ color: '#9CA3AF' }}
        onMouseEnter={e => e.currentTarget.style.color = '#374151'}
        onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-4 mb-4 pr-8">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#111318' }}>Getting started</p>
            <span className="chip chip-neutral">{progress}%</span>
          </div>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Complete these tasks to set up your workspace</p>
        </div>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden ml-auto max-w-[120px]" style={{ backgroundColor: '#F3F4F6' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#16A34A' : '#111318' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {tasks.map(task => (
          <button
            key={task.id}
            onClick={() => handleToggle(task.id)}
            className="flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors"
            style={{
              border: '1px solid #E5E7EB',
              backgroundColor: task.is_completed ? '#F9FAFB' : '#FFFFFF',
            }}
            onMouseEnter={e => { if (!task.is_completed) e.currentTarget.style.backgroundColor = '#F7F7F6'; }}
            onMouseLeave={e => { if (!task.is_completed) e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            {task.is_completed ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#16A34A' }} />
            ) : (
              <Circle className="w-4 h-4 flex-shrink-0" style={{ color: '#D1D5DB' }} />
            )}
            <span
              style={{
                fontSize: '13px',
                color: task.is_completed ? '#9CA3AF' : '#374151',
                textDecoration: task.is_completed ? 'line-through' : 'none',
              }}
            >
              {task.task_name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;