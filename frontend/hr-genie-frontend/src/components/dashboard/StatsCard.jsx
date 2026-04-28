import React from 'react';

const StatsCard = ({ icon: Icon, title, value, subtitle }) => {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-zinc-500 mb-1 truncate">{title}</p>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight">{value}</p>
          {subtitle && <p className="text-[12px] text-zinc-400 mt-1.5">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-md bg-zinc-100 border border-zinc-200/50">
          <Icon className="w-4 h-4 text-zinc-600" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;