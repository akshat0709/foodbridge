import React from 'react';

/** FoodBridge mark: a turmeric bridge arch spanning a steel bowl of rice. Same drawing as the favicon. */
export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#1E5B3C" />
    <path d="M6 15.5 Q16 4 26 15.5" fill="none" stroke="#D99A1E" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M7.5 18 H24.5 Q24 25.5 16 25.5 Q8 25.5 7.5 18 Z" fill="#F3F6F5" />
    <path d="M11 18 Q16 14.6 21 18 Z" fill="#F3F6F5" />
  </svg>
);
