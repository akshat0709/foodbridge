import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { BrandMark } from './BrandMark';
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
} from 'lucide-react';

type NavItem = { to: string; label: string; icon: React.ElementType };
type NavSection = { title: string; roles: UserRole[]; items: NavItem[] };

export const SECTIONS: NavSection[] = [
  {
    title: 'Hostel mess',
    roles: ['MESS_ADMIN', 'PLATFORM_ADMIN'],
    items: [
      { to: '/mess/report', label: 'Post surplus food', icon: PlusCircle },
      { to: '/mess/listings', label: 'My listings', icon: ListOrdered },
      { to: '/mess/meals', label: 'Meal log', icon: UtensilsCrossed },
      { to: '/mess/forecast', label: 'Waste forecast', icon: TrendingDown },
      { to: '/mess/analytics', label: 'My analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'NGO pickups',
    roles: ['NGO_REP', 'PLATFORM_ADMIN'],
    items: [
      { to: '/ngo/donations', label: 'Food near you', icon: MapPin },
      { to: '/ngo/pickups', label: 'My pickups', icon: Truck },
      { to: '/ngo/settings', label: 'Service area', icon: Settings2 },
      { to: '/ngo/performance', label: 'Performance', icon: Award },
    ],
  },
  {
    title: 'Platform',
    roles: ['PLATFORM_ADMIN'],
    items: [
      { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
      { to: '/admin/analytics', label: 'Analytics explorer', icon: BarChart3 },
      { to: '/admin/matching-lab', label: 'Matching lab', icon: GitCompare },
      { to: '/admin/forecast-lab', label: 'Forecast lab', icon: Cpu },
      { to: '/admin/quality', label: 'Data quality', icon: ShieldCheck },
      { to: '/admin/benchmarks', label: 'Query benchmarks', icon: Gauge },
      { to: '/admin/settings', label: 'Settings', icon: Sliders },
      { to: '/admin/reports', label: 'Monthly reports', icon: FileText },
    ],
  },
];

export const ROLE_LABEL: Record<UserRole, string> = {
  MESS_ADMIN: 'Mess manager',
  NGO_REP: 'NGO coordinator',
  PLATFORM_ADMIN: 'Platform admin',
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const role = user?.role;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center gap-2.5 pl-3 pr-2 py-[7px] rounded-md text-[14px] transition-colors ${
      isActive
        ? 'bg-white/10 text-white font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-turmeric'
        : 'text-[#B9CEC2] hover:bg-white/5 hover:text-white'
    }`;

  return (
    <aside className="hidden md:flex w-60 bg-brand-deep text-white flex-col h-screen shrink-0 select-none">
      <div className="h-16 px-5 flex items-center gap-2.5 shrink-0">
        <BrandMark className="w-8 h-8" />
        <span className="font-display text-[19px] font-semibold tracking-tight">FoodBridge</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6" aria-label="Main">
        {SECTIONS.filter(s => role && s.roles.includes(role)).map(section => (
          <div key={section.title}>
            <h2 className="px-3 mb-1.5 text-[13px] font-medium text-[#7FA08E]" style={{ fontVariationSettings: "'wdth' 100" }}>
              {section.title}
            </h2>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <item.icon className="w-[18px] h-[18px] shrink-0 opacity-90" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3.5 border-t border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-turmeric text-brand-deep flex items-center justify-center font-display font-bold shrink-0">
          {user?.name?.charAt(0) || '?'}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <span className="block text-sm font-semibold truncate">{user?.name?.replace(/\s*\(.*\)$/, '') || 'Signed out'}</span>
          <span className="block text-xs text-[#9DB8A9] truncate">
            {role ? ROLE_LABEL[role] : ''}
            {user?.organization?.name ? `, ${user.organization.name}` : ''}
          </span>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-md text-[#B9CEC2] hover:text-white hover:bg-white/10"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
