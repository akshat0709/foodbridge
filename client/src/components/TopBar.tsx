import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FilterContext';
import { apiRequest } from '../api/client';
import {
  Calendar,
  Filter,
  Moon,
  Sun,
  UserCheck,
  RefreshCw,
  SlidersHorizontal,
  LogIn,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const { user, switchDemoRole, darkMode, toggleDarkMode } = useAuth();
  const { filters, setFilter, resetFilters } = useFilters();
  const [messes, setMesses] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);

  useEffect(() => {
    apiRequest('/messes')
      .then(res => setMesses(res))
      .catch(() => {});
    apiRequest('/ngos')
      .then(res => setNgos(res))
      .catch(() => {});
  }, []);

  return (
    <header className="h-14 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-4 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Global Filter Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5 text-text-muted-light dark:text-text-muted-dark font-medium">
          <Filter className="w-3.5 h-3.5 text-brand" />
          <span>Global Filter:</span>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-1 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded px-2 py-1">
          <Calendar className="w-3 h-3 text-text-muted-light dark:text-text-muted-dark" />
          <input
            type="date"
            value={filters.startDate}
            onChange={e => setFilter('startDate', e.target.value)}
            className="bg-transparent border-none text-text-primary-light dark:text-text-primary-dark font-mono text-[11px] focus:outline-hidden"
          />
          <span className="text-text-muted-light dark:text-text-muted-dark">→</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={e => setFilter('endDate', e.target.value)}
            className="bg-transparent border-none text-text-primary-light dark:text-text-primary-dark font-mono text-[11px] focus:outline-hidden"
          />
        </div>

        {/* Mess Filter Dropdown */}
        <select
          value={filters.messId}
          onChange={e => setFilter('messId', e.target.value)}
          className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded px-2.5 py-1 text-xs text-text-primary-light dark:text-text-primary-dark focus:outline-hidden max-w-[160px] truncate"
        >
          <option value="ALL">All Messes (60)</option>
          {messes.map(m => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* NGO Filter Dropdown */}
        <select
          value={filters.ngoId}
          onChange={e => setFilter('ngoId', e.target.value)}
          className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded px-2.5 py-1 text-xs text-text-primary-light dark:text-text-primary-dark focus:outline-hidden max-w-[160px] truncate"
        >
          <option value="ALL">All NGOs (25)</option>
          {ngos.map(n => (
            <option key={n._id} value={n._id}>
              {n.name}
            </option>
          ))}
        </select>

        {/* Reset Filter Button */}
        {(filters.messId !== 'ALL' || filters.ngoId !== 'ALL' || filters.mealType !== 'ALL') && (
          <button
            onClick={resetFilters}
            className="p-1 rounded text-text-muted-light dark:text-text-muted-dark hover:text-danger hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right Controls: Role Switcher & Dark Mode */}
      <div className="flex items-center gap-3">
        {/* Role Quick-Switch Segmented Pill for Evaluator */}
        <div className="hidden md:flex items-center gap-1 p-0.5 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded text-[11px] font-medium">
          <span className="px-2 text-text-muted-light dark:text-text-muted-dark flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-brand" /> Role:
          </span>
          <button
            onClick={() => switchDemoRole('MESS_ADMIN')}
            className={`px-2 py-0.5 rounded-xs transition-colors ${
              user?.role === 'MESS_ADMIN'
                ? 'bg-surface-light dark:bg-surface-dark shadow-2xs font-semibold text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
            }`}
          >
            Mess
          </button>
          <button
            onClick={() => switchDemoRole('NGO_REP')}
            className={`px-2 py-0.5 rounded-xs transition-colors ${
              user?.role === 'NGO_REP'
                ? 'bg-surface-light dark:bg-surface-dark shadow-2xs font-semibold text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
            }`}
          >
            NGO
          </button>
          <button
            onClick={() => switchDemoRole('PLATFORM_ADMIN')}
            className={`px-2 py-0.5 rounded-xs transition-colors ${
              user?.role === 'PLATFORM_ADMIN'
                ? 'bg-surface-light dark:bg-surface-dark shadow-2xs font-semibold text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-secondary-light dark:text-text-secondary-dark"
          title="Toggle Dark / Light Theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Direct Login / Switch Account Link */}
        <NavLink
          to="/login"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-primary-light dark:text-text-primary-dark transition-colors"
          title="Open login portal"
        >
          <LogIn className="w-3.5 h-3.5 text-brand" />
          <span>{user ? 'Switch Account' : 'Log In'}</span>
        </NavLink>

        {/* Built by Akshat Header Badge */}
        <a
          href="https://builtbyakshat.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-brand/10 text-brand hover:bg-brand/20 border border-brand/20 transition-colors"
          title="Visit Creator Website"
        >
          Built by Akshat ↗
        </a>
      </div>
    </header>
  );
};
