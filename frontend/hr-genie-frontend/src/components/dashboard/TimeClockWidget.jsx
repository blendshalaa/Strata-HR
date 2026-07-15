import React, { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const TimeClockWidget = ({ compact = false }) => {
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
        const now = Date.now();
        const diff = now - start;
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
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
      const latest = res.data.timesheets?.[0];
      setActiveShift(latest && !latest.clock_out ? latest : null);
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

  const isClockedIn = !!activeShift;

  if (loading && !activeShift) {
    return (
      <div className={`card flex items-center justify-center ${compact ? 'h-20' : 'h-full'}`}>
        <div className="w-5 h-5 border-2 border-zinc-900 rounded-full animate-spin border-t-transparent" />
      </div>
    );
  }

  // Compact mode — used in timesheets page header
  if (compact) {
    return (
      <div className={`flex items-center gap-4 p-4 rounded-lg border shadow-sm transition-colors ${isClockedIn ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-zinc-200'}`}>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
            {isClockedIn ? t('dashboard.shiftInProgress') : t('dashboard.readyToWork')}
          </p>
          <p className={`text-2xl font-black tabular-nums tracking-tight ${isClockedIn ? 'text-emerald-600' : 'text-zinc-300'}`}>
            {elapsed}
          </p>
        </div>
        <button
          onClick={handlePunch}
          disabled={loading}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm transition-all ${
            isClockedIn
              ? 'bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50'
              : 'bg-[#111318] text-white hover:bg-[#374151]'
          }`}
        >
          {isClockedIn ? (
            <><Square className="w-3.5 h-3.5 fill-current" /> Clock Out</>
          ) : (
            <><Play className="w-3.5 h-3.5 fill-current" /> Clock In</>
          )}
        </button>
        <div className="shrink-0 text-right hidden sm:block">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    );
  }

  // Full mode — used on Dashboard
  return (
    <div className={`card h-full flex flex-col items-center justify-center p-8 transition-colors ${isClockedIn ? 'bg-zinc-50 border-zinc-200' : ''}`}>
      <div className="mb-2 text-center">
        <h3 className="text-zinc-900 font-bold text-[16px] mb-1">
          {isClockedIn ? t('dashboard.shiftInProgress') : t('dashboard.readyToWork')}
        </h3>
        <p className="text-zinc-500 text-[13px]">
          {isClockedIn
            ? t('dashboard.clickClockOut')
            : t('dashboard.clickClockIn')}
        </p>
      </div>

      <div className={`text-4xl sm:text-5xl font-black tabular-nums tracking-tight my-6 ${isClockedIn ? 'text-emerald-600' : 'text-zinc-400'}`}>
        {elapsed}
      </div>

      <button
        onClick={handlePunch}
        disabled={loading}
        className={`w-full max-w-[200px] flex items-center justify-center gap-2 py-3.5 rounded-md font-semibold text-sm transition-all ${
          isClockedIn
            ? 'bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-100'
            : 'bg-[#111318] text-white border border-transparent hover:bg-[#374151]'
        }`}
      >
        {isClockedIn ? (
          <><Square className="w-4 h-4 fill-current" /> Clock Out</>
        ) : (
          <><Play className="w-4 h-4 fill-current" /> Clock In</>
        )}
      </button>

      <div className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-zinc-500">
        <Clock className="w-3.5 h-3.5" />
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
};

export default TimeClockWidget;
