import React from 'react';

const colorMap = {
  primary: { icon: '#111318', bg: '#F3F4F6' },
  green:   { icon: '#16A34A', bg: '#F0FDF4' },
  purple:  { icon: '#111318', bg: '#F3F4F6' },
  amber:   { icon: '#D97706', bg: '#FFFBEB' },
  blue:    { icon: '#111318', bg: '#F3F4F6' },
  indigo:  { icon: '#111318', bg: '#F3F4F6' },
  red:     { icon: '#DC2626', bg: '#FEF2F2' },
};

const StatsCard = ({ icon: Icon, title, value, subtitle, color = 'primary' }) => {
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="section-label mb-1.5 truncate">{title}</p>
          <p className="tabular" style={{ fontSize: '24px', fontWeight: '500', color: '#111318', lineHeight: '1.2' }}>{value}</p>
          {subtitle && <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>{subtitle}</p>}
        </div>
        <div className="p-2 rounded flex-shrink-0" style={{ backgroundColor: c.bg }}>
          <Icon className="w-4 h-4" style={{ color: c.icon }} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;