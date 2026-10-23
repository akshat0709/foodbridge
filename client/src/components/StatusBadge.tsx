import React from 'react';

export type BadgeStatus = 'AVAILABLE' | 'RESERVED' | 'COLLECTED' | 'COMPLETED' | 'EXPIRED' | 'FAILED' | 'ACTIVE';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = (status || '').toUpperCase();

  const styles: Record<string, string> = {
    AVAILABLE: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#14532D] dark:text-[#86EFAC] dark:border-[#166534]',
    RESERVED: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A] dark:bg-[#78350F] dark:text-[#FCD34D] dark:border-[#B45309]',
    COLLECTED: 'bg-[#E0E7FF] text-[#3730A3] border-[#C7D2FE] dark:bg-[#312E81] dark:text-[#A5B4FC] dark:border-[#4338CA]',
    COMPLETED: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#14532D] dark:text-[#86EFAC] dark:border-[#166534]',
    EXPIRED: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#7F1D1D] dark:text-[#FCA5A5] dark:border-[#991B1B]',
    FAILED: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#7F1D1D] dark:text-[#FCA5A5] dark:border-[#991B1B]',
    ACTIVE: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#14532D] dark:text-[#86EFAC] dark:border-[#166534]',
  };

  const currentStyle =
    styles[normalized] || 'bg-bg-light text-text-secondary-light border-border-light dark:bg-bg-dark dark:text-text-secondary-dark dark:border-border-dark';

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded border ${sizeClasses} ${currentStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {normalized}
    </span>
  );
};
