import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, ROLE_HOME, UserRole } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';

// Mess Admin Pages
import { ReportSurplus } from './pages/mess/ReportSurplus';
import { MyListings } from './pages/mess/MyListings';
import { MealLog } from './pages/mess/MealLog';
import { WasteForecast } from './pages/mess/WasteForecast';
import { MyAnalytics } from './pages/mess/MyAnalytics';

// NGO Pages
import { NearbyDonations } from './pages/ngo/NearbyDonations';
import { MyPickups } from './pages/ngo/MyPickups';
import { ServiceSettings } from './pages/ngo/ServiceSettings';
import { Performance } from './pages/ngo/Performance';

// Platform Admin Pages
import { Overview } from './pages/admin/Overview';
import { AnalyticsExplorer } from './pages/admin/AnalyticsExplorer';
import { MatchingLab } from './pages/admin/MatchingLab';
import { ForecastLab } from './pages/admin/ForecastLab';
import { DataQuality } from './pages/admin/DataQuality';
import { Benchmarks } from './pages/admin/Benchmarks';
import { UserSettings } from './pages/admin/UserSettings';
import { Reports } from './pages/admin/Reports';

const FullScreenMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="h-screen w-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark text-text-muted-light font-mono text-xs">
    {text}
  </div>
);

/** Requires a signed-in user; otherwise sends them to /login and remembers where they were going. */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenMessage text="Authenticating session..." />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
};

/** Restricts a section to certain roles (platform admins can open every section, matching the sidebar). */
const RoleRoute: React.FC<{ roles: UserRole[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'PLATFORM_ADMIN' && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenMessage text="Bootstrapping FoodBridge Operations Console..." />;
  }

  const mess = (el: React.ReactNode) => <RoleRoute roles={['MESS_ADMIN']}>{el}</RoleRoute>;
  const ngo = (el: React.ReactNode) => <RoleRoute roles={['NGO_REP']}>{el}</RoleRoute>;
  const admin = (el: React.ReactNode) => <RoleRoute roles={['PLATFORM_ADMIN']}>{el}</RoleRoute>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={ROLE_HOME[user.role]} replace /> : <Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Default route redirect based on role */}
        <Route path="/" element={<Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />} />

        {/* Mess Admin Routes */}
        <Route path="/mess/report" element={mess(<ReportSurplus />)} />
        <Route path="/mess/listings" element={mess(<MyListings />)} />
        <Route path="/mess/meals" element={mess(<MealLog />)} />
        <Route path="/mess/forecast" element={mess(<WasteForecast />)} />
        <Route path="/mess/analytics" element={mess(<MyAnalytics />)} />

        {/* NGO Routes */}
        <Route path="/ngo/donations" element={ngo(<NearbyDonations />)} />
        <Route path="/ngo/pickups" element={ngo(<MyPickups />)} />
        <Route path="/ngo/settings" element={ngo(<ServiceSettings />)} />
        <Route path="/ngo/performance" element={ngo(<Performance />)} />

        {/* Platform Admin Routes */}
        <Route path="/admin/overview" element={admin(<Overview />)} />
        <Route path="/admin/analytics" element={admin(<AnalyticsExplorer />)} />
        <Route path="/admin/matching-lab" element={admin(<MatchingLab />)} />
        <Route path="/admin/forecast-lab" element={admin(<ForecastLab />)} />
        <Route path="/admin/quality" element={admin(<DataQuality />)} />
        <Route path="/admin/benchmarks" element={admin(<Benchmarks />)} />
        <Route path="/admin/settings" element={admin(<UserSettings />)} />
        <Route path="/admin/reports" element={admin(<Reports />)} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <AppRoutes />
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
