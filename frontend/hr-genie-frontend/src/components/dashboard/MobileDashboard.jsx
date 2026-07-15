import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, Sparkles, AlertTriangle, ShieldAlert, 
  Trophy, Calendar, Clock, UserCheck, MessageSquare 
} from 'lucide-react';
import TimeClockWidget from './TimeClockWidget';
import StatsCard from './StatsCard';

const MobileDashboard = ({ stats, balance, user, isHR }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      
      {/* 1. Time Clock - Most Important on Mobile (Employees Only) */}
      {!isHR && <TimeClockWidget />}


      {/* 2. Welcome Banner (Compact) */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '0.5px solid rgba(17,19,24,0.3)' }}>
        <h1 className="text-xl font-semibold mb-1 tracking-tight text-white">
          {t('dashboard.welcomeBack', { name: user?.name?.split(' ')[0] })}
        </h1>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {t('dashboard.whatsHappening', "Here's what's happening today.")}
        </p>
      </div>

      {/* 3. Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard icon={Calendar} title={t('dashboard.sickLeaveBalance', 'Sick Leave')} value={balance?.sick_leave_balance || 0} subtitle={t('common.daysRemaining', 'Days left')} color="green" />
        <StatsCard icon={Calendar} title={t('dashboard.vacationBalance', 'Vacation')} value={balance?.vacation_balance || 0} subtitle={t('common.daysRemaining', 'Days left')} color="purple" />
        {isHR && (
          <StatsCard icon={MessageSquare} title={t('dashboard.totalConversations', 'Chats')} value={stats?.stats?.total_conversations || 0} subtitle={t('dashboard.activeChats', 'Active')} color="primary" />
        )}
      </div>

      {/* 4. Action Needed Stack */}
      {!isHR ? (
        <div className="card space-y-3 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-[14px] font-bold text-zinc-900">{t('dashboard.needsYourAttention', 'Needs Attention')}</h3>
          </div>
          
          <button
            onClick={() => navigate('/documents')}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
              stats?.stats?.pending_documents > 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className={`w-4 h-4 ${stats?.stats?.pending_documents > 0 ? 'text-rose-600' : 'text-zinc-400'}`} />
              <span className="text-[13px] font-medium text-zinc-900">{t('dashboard.signDocuments', 'Sign Documents')}</span>
            </div>
            <span className={`text-[13px] font-black ${stats?.stats?.pending_documents > 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
              {stats?.stats?.pending_documents ?? 0}
            </span>
          </button>

          <button
            onClick={() => navigate('/goals')}
            className="w-full flex items-center justify-between p-3 rounded-lg border bg-zinc-50 border-zinc-200"
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-zinc-400" />
              <span className="text-[13px] font-medium text-zinc-900">{t('dashboard.activeGoals', 'Active Goals')}</span>
            </div>
            <span className="text-[13px] font-black text-zinc-400">
              {stats?.stats?.active_goals ?? 0}
            </span>
          </button>

          <button
            onClick={() => navigate('/training')}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
              stats?.stats?.pending_trainings > 0
                ? 'bg-zinc-100 border-zinc-900'
                : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className={`w-4 h-4 ${stats?.stats?.pending_trainings > 0 ? 'text-zinc-900' : 'text-zinc-400'}`} />
              <span className="text-[13px] font-medium text-zinc-900">{t('dashboard.assignedTraining', 'Assigned Training')}</span>
            </div>
            <span className={`text-[13px] font-black ${stats?.stats?.pending_trainings > 0 ? 'text-zinc-900' : 'text-zinc-400'}`}>
              {stats?.stats?.pending_trainings ?? 0}
            </span>
          </button>
        </div>
      ) : (
        <div className="card space-y-3 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-[14px] font-bold text-zinc-900">{t('dashboard.needsYourAttention', 'Needs Attention')}</h3>
          </div>
          
          <button
            onClick={() => navigate('/leave-approvals')}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
              stats?.stats?.pending_leaves > 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className={`w-4 h-4 ${stats?.stats?.pending_leaves > 0 ? 'text-rose-600' : 'text-zinc-400'}`} />
              <span className="text-[13px] font-medium text-zinc-900">Pending Leave Approvals</span>
            </div>
            <span className={`text-[13px] font-black ${stats?.stats?.pending_leaves > 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
              {stats?.stats?.pending_leaves ?? 0}
            </span>
          </button>

          <button
            onClick={() => navigate('/timesheets')}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
              stats?.stats?.pending_timesheets > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className={`w-4 h-4 ${stats?.stats?.pending_timesheets > 0 ? 'text-amber-600' : 'text-zinc-400'}`} />
              <span className="text-[13px] font-medium text-zinc-900">Pending Timesheets</span>
            </div>
            <span className={`text-[13px] font-black ${stats?.stats?.pending_timesheets > 0 ? 'text-amber-600' : 'text-zinc-400'}`}>
              {stats?.stats?.pending_timesheets ?? 0}
            </span>
          </button>
        </div>
      )}

      {/* 5. Upcoming Shifts (Compact List) */}
      {!isHR && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-zinc-900">{t('dashboard.upcomingShifts', 'Upcoming Shifts')}</h3>
            <Calendar className="w-4 h-4 text-zinc-400" />
          </div>
          
          <div className="space-y-2">
            {stats?.upcoming_shifts?.length > 0 ? (
              stats.upcoming_shifts.slice(0, 3).map((shift, idx) => {
                const start = new Date(shift.start_time);
                const end = new Date(shift.end_time);
                const isToday = start.toDateString() === new Date().toDateString();
                
                return (
                  <div key={shift.id || idx} className="p-3 border border-zinc-100 rounded-lg bg-zinc-50 flex items-center justify-between relative overflow-hidden">
                    {isToday && <div className="absolute top-0 left-0 w-1 h-full bg-zinc-900"></div>}
                    <div>
                      <p className="text-[13px] font-bold text-zinc-900">
                        {isToday ? 'Today' : start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium mt-0.5">
                        <Clock className="w-3 h-3" />
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${isToday ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-200/50 text-zinc-500'}`}>
                      {shift.role}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center">
                <p className="text-[12px] font-semibold text-zinc-400">{t('dashboard.noUpcomingShifts', 'No upcoming shifts')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. HR Summary (Mobile) */}
      {isHR && (
        <div className="card p-4 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[14px] font-bold text-zinc-900">Attendance Today</h3>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-black text-zinc-900 leading-none">{stats?.stats?.attendance_today ?? 0}</span>
            <span className="text-sm font-bold text-zinc-400 mb-0.5">/ {stats?.stats?.total_users ?? 0} in</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-zinc-100">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${stats?.stats?.total_users > 0 ? Math.round((stats.stats.attendance_today / stats.stats.total_users) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MobileDashboard;
