import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LeaveBalance = ({ balance }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card bg-white border border-zinc-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-zinc-100 border border-zinc-200 rounded-md">
            <Calendar className="w-4 h-4 text-zinc-600" />
          </div>
          <h3 className="text-[14px] font-bold text-zinc-900">{t('leaveBalance.sickLeave')}</h3>
        </div>
        <p className="text-3xl font-black text-zinc-900 tracking-tight">{balance?.sick_leave_balance || 0}</p>
        <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider mt-1">{t('leaveBalance.daysRemaining')}</p>
      </div>

      <div className="card bg-white border border-zinc-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-zinc-100 border border-zinc-200 rounded-md">
            <Clock className="w-4 h-4 text-zinc-600" />
          </div>
          <h3 className="text-[14px] font-bold text-zinc-900">{t('leaveBalance.vacation')}</h3>
        </div>
        <p className="text-3xl font-black text-zinc-900 tracking-tight">{balance?.vacation_balance || 0}</p>
        <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider mt-1">{t('leaveBalance.daysRemaining')}</p>
      </div>
    </div>
  );
};

export default LeaveBalance;