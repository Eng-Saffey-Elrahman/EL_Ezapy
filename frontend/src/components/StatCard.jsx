import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'var(--primary)', bg = 'var(--primary-light)' }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrapper" style={{ backgroundColor: bg, color: color }}>
        {Icon && <Icon size={26} strokeWidth={2.2} />}
      </div>
      <div className="stat-info">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};
