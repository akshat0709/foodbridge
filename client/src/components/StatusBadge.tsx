import React from 'react';

export type BadgeStatus = 'AVAILABLE' | 'RESERVED' | 'COLLECTED' | 'COMPLETED' | 'EXPIRED' | 'FAILED' | 'ACTIVE';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  size?: 'sm' | 'md';
}

// Each status reads as a step in the pickup journey, so the wording says what is happening to the food.
const STATUS: Record<string, { label: string; cls: string }> = {
  AVAILABLE: { label: 'Available', cls: 'bg-[#E1EFE6] text-[#1E5B3C] dark:bg-[#1B3A2A] dark:text-[#9FD4B2]' },
  RESERVED: { label: 'Claimed', cls: 'bg-[#FBF0D9] text-[#8A5D06] dark:bg-[#4A3608] dark:text-[#E8B04A]' },
  COLLECTED: { label: 'Picked up', cls: 'bg-[#E2EAF2] text-[#2F4F6E] dark:bg-[#1E2F40] dark:text-[#A9C2DA]' },
  COMPLETED: { label: 'Delivered', cls: 'bg-[#1E5B3C] text-white dark:bg-[#6FBF8E] dark:text-[#0F1714]' },
  EXPIRED: { label: 'Expired', cls: 'bg-[#F8E3DE] text-[#8E3322] dark:bg-[#4A1F17] dark:text-[#F0A895]' },
  FAILED: { label: 'Failed', cls: 'bg-[#F8E3DE] text-[#8E3322] dark:bg-[#4A1F17] dark:text-[#F0A895]' },
  ACTIVE: { label: 'Active', cls: 'bg-[#E1EFE6] text-[#1E5B3C] dark:bg-[#1B3A2A] dark:text-[#9FD4B2]' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const key = (status || '').toUpperCase();
  const s = STATUS[key] || {
    label: key ? key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ') : 'Unknown',
    cls: 'bg-bg-light text-text-secondary-light dark:bg-bg-dark dark:text-text-secondary-dark',
  };
  const sizeClasses = size === 'sm' ? 'px-2 py-px text-xs' : 'px-2.5 py-0.5 text-[13px]';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap ${sizeClasses} ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {s.label}
    </span>
  );
};
