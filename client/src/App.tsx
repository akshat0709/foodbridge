import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark text-text-muted-light font-mono text-xs">
        Bootstrapping FoodBridge Operations Console...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Layout />}>
        {/* Default route redirect based on role */}
        <Route
          path="/"
          element={
            user?.role === 'MESS_ADMIN' ? (
              <Navigate to="/mess/report" replace />
            ) : user?.role === 'NGO_REP' ? (
              <Navigate to="/ngo/donations" replace />
            ) : (
              <Navigate to="/admin/overview" replace />
            )
          }
        />

        {/* Mess Admin Routes */}
        <Route path="/mess/report" element={<ReportSurplus />} />
        <Route path="/mess/listings" element={<MyListings />} />
        <Route path="/mess/meals" element={<MealLog />} />
        <Route path="/mess/forecast" element={<WasteForecast />} />
        <Route path="/mess/analytics" element={<MyAnalytics />} />

        {/* NGO Routes */}
        <Route path="/ngo/donations" element={<NearbyDonations />} />
        <Route path="/ngo/pickups" element={<MyPickups />} />
        <Route path="/ngo/settings" element={<ServiceSettings />} />
        <Route path="/ngo/performance" element={<Performance />} />

        {/* Platform Admin Routes */}
        <Route path="/admin/overview" element={<Overview />} />
        <Route path="/admin/analytics" element={<AnalyticsExplorer />} />
        <Route path="/admin/matching-lab" element={<MatchingLab />} />
        <Route path="/admin/forecast-lab" element={<ForecastLab />} />
        <Route path="/admin/quality" element={<DataQuality />} />
        <Route path="/admin/benchmarks" element={<Benchmarks />} />
        <Route path="/admin/settings" element={<UserSettings />} />
        <Route path="/admin/reports" element={<Reports />} />
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
