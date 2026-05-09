import React from 'react';

const colorMap = {
  primary: { bg: '#EEF0FF', icon: '#5B4FE8', bar: '#5B4FE8' },
  green:   { bg: '#ECFDF5', icon: '#059669', bar: '#059669' },
  purple:  { bg: '#EEF0FF', icon: '#5B4FE8', bar: '#5B4FE8' },
  amber:   { bg: '#FFF8EB', icon: '#B45309', bar: '#B45309' },
  blue:    { bg: '#EEF0FF', icon: '#5B4FE8', bar: '#5B4FE8' },
  indigo:  { bg: '#EEF0FF', icon: '#5B4FE8', bar: '#5B4FE8' },
  red:     { bg: '#FEF2F2', icon: '#DC2626', bar: '#DC2626' },
};

const StatsCard = ({ icon: Icon, title, value, subtitle, color = 'primary' }) => {
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wider mb-2 truncate" style={{ color: '#6B7280' }}>{title}</p>
          <p className="text-[28px] font-bold tracking-tight leading-none" style={{ color: '#0F0D2E' }}>{value}</p>
          {subtitle && <p className="text-[12px] mt-2" style={{ color: '#9CA3AF' }}>{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-md flex-shrink-0" style={{ backgroundColor: c.bg }}>
          <Icon className="w-4 h-4" style={{ color: c.icon }} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;