import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_HOME, UserRole } from '../context/AuthContext';
import { useFilters, defaultFilters } from '../context/FilterContext';
import { apiRequest } from '../api/client';
import { BrandMark } from './BrandMark';
import { SECTIONS, ROLE_LABEL } from './Sidebar';
import { Calendar, Moon, Sun, RotateCcw, Menu, X, LogOut } from 'lucide-react';

const controlClass =
  'h-9 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md px-2.5 text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:border-brand';

export const TopBar: React.FC = () => {
  const { user, switchDemoRole, logout, darkMode, toggleDarkMode } = useAuth();
  const { filters, setFilter, resetFilters } = useFilters();
  const navigate = useNavigate();
  const location = useLocation();
  const [messes, setMesses] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const isAdmin = user?.role === 'PLATFORM_ADMIN';

  // Close the mobile menu whenever the page changes.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // The mess / NGO filters only apply to platform-wide analytics.
  useEffect(() => {
    if (!isAdmin) return;
    apiRequest('/messes').then(setMesses).catch(() => {});
    apiRequest('/ngos').then(setNgos).catch(() => {});
  }, [isAdmin]);

  // Demo helper: signs in as another seeded account (a real login) and opens its home page.
  const handleSwitchRole = async (role: UserRole) => {
    if (user?.role === role) return;
    setSwitching(true);
    try {
      const u = await switchDemoRole(role);
      navigate(ROLE_HOME[u.role]);
    } catch (err: any) {
      window.alert(`Could not switch account: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const filtersActive = (Object.keys(defaultFilters) as (keyof typeof defaultFilters)[]).some(
    k => filters[k] !== defaultFilters[k]
  );

  return (
    <>
      <header className="min-h-16 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur border-b border-border-light dark:border-border-dark px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button
          className="md:hidden p-2 -ml-2 rounded-md text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="md:hidden flex items-center gap-2">
          <BrandMark className="w-7 h-7" />
          <span className="font-display font-semibold">FoodBridge</span>
        </div>

        {isAdmin ? (
          <div className="hidden md:flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
            <label className={`${controlClass} flex items-center gap-1.5`}>
              <Calendar className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark shrink-0" />
              <span className="sr-only">From</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => setFilter('startDate', e.target.value)}
                className="bg-transparent border-none text-sm focus:outline-none w-[8.5rem]"
              />
              <span className="text-text-muted-light dark:text-text-muted-dark">to</span>
              <span className="sr-only">To</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => setFilter('endDate', e.target.value)}
                className="bg-transparent border-none text-sm focus:outline-none w-[8.5rem]"
              />
            </label>

            <select
              aria-label="Filter by mess"
              value={filters.messId}
              onChange={e => setFilter('messId', e.target.value)}
              className={`${controlClass} max-w-[190px]`}
            >
              <option value="ALL">All messes</option>
              {messes.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by NGO"
              value={filters.ngoId}
              onChange={e => setFilter('ngoId', e.target.value)}
              className={`${controlClass} max-w-[190px]`}
            >
              <option value="ALL">All NGOs</option>
              {ngos.map(n => (
                <option key={n._id} value={n._id}>
                  {n.name}
                </option>
              ))}
            </select>

            {filtersActive && (
              <button
                onClick={resetFilters}
                className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-md text-sm text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark"
              >
                <RotateCcw className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="hidden md:block flex-1 min-w-0">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
              {user?.organization?.name ? (
                <>
                  Signed in for <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{user.organization.name}</span>
                </>
              ) : null}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <label className="hidden sm:flex items-center gap-2 text-sm text-text-muted-light dark:text-text-muted-dark">
            <span className="hidden lg:inline">Demo account</span>
            <select
              aria-label="Switch demo account"
              value={user?.role}
              disabled={switching}
              onChange={e => handleSwitchRole(e.target.value as UserRole)}
              className={`${controlClass} font-medium`}
            >
              {(Object.keys(ROLE_LABEL) as UserRole[]).map(r => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={toggleDarkMode}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark"
            title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile navigation */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-brand-deep text-white flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrandMark className="w-8 h-8" />
                <span className="font-display text-lg font-semibold">FoodBridge</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-md hover:bg-white/10" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 space-y-5">
              {SECTIONS.filter(s => user && s.roles.includes(user.role)).map(s => (
                <div key={s.title}>
                  <h2 className="px-3 mb-1 text-[13px] font-medium text-[#7FA08E]">{s.title}</h2>
                  {s.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-md text-[15px] ${
                          isActive ? 'bg-white/10 font-semibold' : 'text-[#B9CEC2]'
                        }`
                      }
                    >
                      <item.icon className="w-[18px] h-[18px]" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10 space-y-3">
              <select
                aria-label="Switch demo account"
                value={user?.role}
                disabled={switching}
                onChange={e => handleSwitchRole(e.target.value as UserRole)}
                className="w-full h-10 rounded-md bg-white/10 border border-white/15 px-2.5 text-sm"
              >
                {(Object.keys(ROLE_LABEL) as UserRole[]).map(r => (
                  <option key={r} value={r} className="text-black">
                    Demo: {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <button onClick={logout} className="w-full h-10 rounded-md bg-white/10 inline-flex items-center justify-center gap-2 text-sm font-medium">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
