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

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtext,
  trend,
  icon,
}) => {
  return (
    <div className="p-3.5 rounded-md bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex flex-col justify-between">
      <div className="flex items-center justify-between text-xs text-text-muted-light dark:text-text-muted-dark">
        <span className="font-medium">{label}</span>
        {icon && <span className="text-text-secondary-light dark:text-text-secondary-dark">{icon}</span>}
      </div>

      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight font-mono text-text-primary-light dark:text-text-primary-dark">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-text-muted-light dark:text-text-muted-dark font-medium">
            {unit}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-2 text-[11px] text-text-secondary-light dark:text-text-secondary-dark flex items-center justify-between">
          <span>{subtext}</span>
          {trend && (
            <span
              className={`font-mono font-medium ${
                trend.value > 0
                  ? trend.isPositiveGood !== false
                    ? 'text-brand'
                    : 'text-danger'
                  : trend.isPositiveGood !== false
                  ? 'text-danger'
                  : 'text-brand'
              }`}
            >
              {trend.value > 0 ? '+' : ''}
              {trend.value}% {trend.period || 'vs prev'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
