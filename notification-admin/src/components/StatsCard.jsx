import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary', 
  trend, 
  trendUp = true, 
  trendLabel = 'since last week',
  loading = false 
}) => {
  
  // Theme color maps for classes
  const colorClasses = {
    primary: {
      border: 'border-t-accent-primary',
      iconBg: 'bg-accent-primary/10 text-accent-primary',
    },
    secondary: {
      border: 'border-t-accent-secondary',
      iconBg: 'bg-accent-secondary/10 text-accent-secondary',
    },
    success: {
      border: 'border-t-success',
      iconBg: 'bg-success/10 text-success',
    },
    danger: {
      border: 'border-t-danger',
      iconBg: 'bg-danger/10 text-danger',
    },
    warning: {
      border: 'border-t-warning',
      iconBg: 'bg-warning/10 text-warning',
    },
  };

  const activeColor = colorClasses[color] || colorClasses.primary;

  if (loading) {
    return (
      <div className={`relative overflow-hidden bg-bg-glass border border-border-color border-t-4 ${activeColor.border} rounded-2xl p-6 flex items-center justify-between`}>
        <div className="flex flex-col gap-2 w-3/5">
          <div className="w-20 h-3.5 bg-white/5 rounded-sm animate-pulse"></div>
          <div className="w-28 h-7 bg-white/5 rounded-sm animate-pulse"></div>
        </div>
        <div className="w-12 h-12 bg-white/5 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`group relative overflow-hidden bg-bg-glass border border-border-color border-t-4 ${activeColor.border} rounded-2xl p-6 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:border-border-glow hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]`}>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-text-secondary font-medium">{title}</span>
        <span className="text-2xl md:text-3xl font-bold text-text-primary font-display leading-none">{value}</span>
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`text-xs font-semibold inline-flex items-center gap-0.5 ${
              trendUp ? 'text-success' : 'text-danger'
            }`}>
              {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trend}
            </span>
            <span className="text-xs text-text-muted">
              {trendLabel}
            </span>
          </div>
        )}
      </div>
      
      {Icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${activeColor.iconBg}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};

export default StatsCard;
