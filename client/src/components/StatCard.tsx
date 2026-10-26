import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  trend?: {
    value: number;
    isPositiveGood?: boolean;
    period?: string;
  };
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, subtext, trend, icon }) => {
  const good = trend ? (trend.value > 0) === (trend.isPositiveGood !== false) : false;
  return (
    <div className="p-4 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex flex-col">
      <div className="flex items-start justify-between gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
        <span className="font-medium leading-snug">{label}</span>
        {icon && <span className="text-brand dark:text-[#9FD4B2] shrink-0 mt-0.5">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="figure text-[2rem] leading-none text-text-primary-light dark:text-text-primary-dark">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </span>
        {unit && <span className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">{unit}</span>}
      </div>

      {(subtext || trend) && (
        <div className="mt-auto pt-3 text-[13px] text-text-muted-light dark:text-text-muted-dark flex items-center justify-between gap-2">
          <span>{subtext}</span>
          {trend && (
            <span className={`font-semibold whitespace-nowrap ${good ? 'text-brand dark:text-[#9FD4B2]' : 'text-danger'}`}>
              {trend.value > 0 ? '+' : ''}
              {trend.value}% {trend.period || 'vs previous'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
