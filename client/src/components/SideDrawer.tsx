import React from 'react';
import { X } from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark shadow-xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-muted-light dark:text-text-muted-dark"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
};
