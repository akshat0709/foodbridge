import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  UtensilsCrossed,
  TrendingDown,
  BarChart3,
  MapPin,
  Truck,
  Settings2,
  Award,
  GitCompare,
  Cpu,
  ShieldCheck,
  Gauge,
  Sliders,
  FileText,
  LogOut,
  Building2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const role = user?.role || 'PLATFORM_ADMIN';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
      isActive
        ? 'bg-brand text-white font-semibold shadow-2xs'
        : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
    }`;

  return (
    <aside className="w-56 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col justify-between h-screen shrink-0 select-none">
      <div className="flex flex-col">
        {/* Brand / Logo */}
        <div className="h-14 px-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand flex items-center justify-center text-white font-bold text-xs">
              FB
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-text-primary-light dark:text-text-primary-dark">
                FoodBridge
              </span>
              <span className="block text-[10px] font-mono text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                Ops Dashboard
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* MESS ADMIN SECTION */}
          {(role === 'MESS_ADMIN' || role === 'PLATFORM_ADMIN') && (
            <div>
              <div className="px-3 mb-1 text-[10px] font-semibold tracking-wider text-text-muted-light dark:text-text-muted-dark uppercase">
                Hostel Mess Ops
              </div>
              <div className="space-y-0.5">
                <NavLink to="/mess/report" className={linkClass}>
                  <PlusCircle className="w-4 h-4" />
                  <span>Report Surplus</span>
                </NavLink>
                <NavLink to="/mess/listings" className={linkClass}>
                  <ListOrdered className="w-4 h-4" />
                  <span>My Listings</span>
                </NavLink>
                <NavLink to="/mess/meals" className={linkClass}>
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Meal Log</span>
                </NavLink>
                <NavLink to="/mess/forecast" className={linkClass}>
                  <TrendingDown className="w-4 h-4" />
                  <span>Waste Forecast</span>
                </NavLink>
                <NavLink to="/mess/analytics" className={linkClass}>
                  <BarChart3 className="w-4 h-4" />
                  <span>My Analytics</span>
                </NavLink>
              </div>
            </div>
          )}

          {/* NGO SECTION */}
          {(role === 'NGO_REP' || role === 'PLATFORM_ADMIN') && (
            <div>
              <div className="px-3 mb-1 text-[10px] font-semibold tracking-wider text-text-muted-light dark:text-text-muted-dark uppercase">
                NGO Logistics
              </div>
              <div className="space-y-0.5">
                <NavLink to="/ngo/donations" className={linkClass}>
                  <MapPin className="w-4 h-4" />
                  <span>Nearby Surplus</span>
                </NavLink>
                <NavLink to="/ngo/pickups" className={linkClass}>
                  <Truck className="w-4 h-4" />
                  <span>My Pickups</span>
                </NavLink>
                <NavLink to="/ngo/settings" className={linkClass}>
                  <Settings2 className="w-4 h-4" />
                  <span>Service Area</span>
                </NavLink>
                <NavLink to="/ngo/performance" className={linkClass}>
                  <Award className="w-4 h-4" />
                  <span>Performance</span>
                </NavLink>
              </div>
            </div>
          )}

          {/* PLATFORM ADMIN SECTION */}
          {role === 'PLATFORM_ADMIN' && (
            <div>
              <div className="px-3 mb-1 text-[10px] font-semibold tracking-wider text-text-muted-light dark:text-text-muted-dark uppercase">
                Big Data Analytics
              </div>
              <div className="space-y-0.5">
                <NavLink to="/admin/overview" className={linkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Overview & KPIs</span>
                </NavLink>
                <NavLink to="/admin/analytics" className={linkClass}>
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics Explorer</span>
                </NavLink>
                <NavLink to="/admin/matching-lab" className={linkClass}>
                  <GitCompare className="w-4 h-4" />
                  <span>Matching Lab</span>
                </NavLink>
                <NavLink to="/admin/forecast-lab" className={linkClass}>
                  <Cpu className="w-4 h-4" />
                  <span>Forecast Lab</span>
                </NavLink>
                <NavLink to="/admin/quality" className={linkClass}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Data Quality</span>
                </NavLink>
                <NavLink to="/admin/benchmarks" className={linkClass}>
                  <Gauge className="w-4 h-4" />
                  <span>Big Data Benchmarks</span>
                </NavLink>
                <NavLink to="/admin/settings" className={linkClass}>
                  <Sliders className="w-4 h-4" />
                  <span>System Settings</span>
                </NavLink>
                <NavLink to="/admin/reports" className={linkClass}>
                  <FileText className="w-4 h-4" />
                  <span>Monthly Reports</span>
                </NavLink>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-border-light dark:border-border-dark flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark flex items-center justify-center font-mono font-medium text-brand text-xs shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="truncate">
            <span className="block font-medium text-text-primary-light dark:text-text-primary-dark truncate">
              {user?.name || 'Guest Operator'}
            </span>
            <span className="block text-[10px] font-mono text-text-muted-light dark:text-text-muted-dark">
              {user ? role : 'Not signed in'}
            </span>
          </div>
        </div>

        {user ? (
          <button
            onClick={logout}
            className="p-1.5 rounded hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-muted-light dark:text-text-muted-dark hover:text-danger"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        ) : (
          <NavLink
            to="/login"
            className="px-2.5 py-1 rounded bg-brand text-white font-semibold text-[11px] hover:bg-brand/90 transition-colors shadow-2xs"
          >
            Log In
          </NavLink>
        )}
      </div>

      {/* Attribution Footer */}
      <div className="px-3 py-2 border-t border-border-light dark:border-border-dark flex items-center justify-between text-[11px] text-text-muted-light dark:text-text-muted-dark bg-bg-light/40 dark:bg-bg-dark/40">
        <span>Built by</span>
        <a
          href="https://builtbyakshat.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand hover:underline inline-flex items-center gap-0.5"
        >
          Akshat <span className="text-[9px]">↗</span>
        </a>
      </div>
    </aside>
  );
};
