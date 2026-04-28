import React from 'react';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LeaveRequestList = ({ requests }) => {
  const { t } = useTranslation();
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: Clock,
      },
      approved: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: CheckCircle,
      },
      rejected: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: XCircle,
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider ${config.bg} ${config.text} ${config.border}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (requests.length === 0) {
    return (
      <div className="card text-center py-12">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-slate-400">{t('leaveList.noRequests')}</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden bg-white border border-zinc-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('leaveList.type')}</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('leaveList.startDate')}</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('leaveList.endDate')}</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('leaveList.days')}</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('common.status')}</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('leaveList.reason')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="capitalize text-[13px] font-bold text-zinc-900">
                    {request.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[13px] text-zinc-600">
                  {new Date(request.start_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[13px] text-zinc-600">
                  {new Date(request.end_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[13px] text-zinc-900 font-bold">
                  {request.days}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4 text-[13px] text-zinc-500 max-w-xs truncate">
                  {request.reason || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveRequestList;