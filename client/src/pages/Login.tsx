import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from as string | undefined;

  const [email, setEmail] = useState('platform.admin@foodbridge.org');
  const [password, setPassword] = useState('Pass1234!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const u = await login(email, password);
      navigate(redirectTo && redirectTo !== '/login' ? redirectTo : ROLE_HOME[u.role], { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'MESS_ADMIN' | 'NGO_REP' | 'PLATFORM_ADMIN') => {
    setIsLoading(true);
    setError(null);
    try {
      const u = await switchDemoRole(role);
      navigate(ROLE_HOME[u.role], { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-bg-light dark:bg-bg-dark p-4 select-none">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex w-10 h-10 rounded bg-brand items-center justify-center text-white font-bold text-base mb-2">
            FB
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            FoodBridge Operations Terminal
          </h1>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
            Food redistribution, geospatial dispatch & waste prediction platform
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-[#FEE2E2] dark:bg-[#7F1D1D] border border-[#FECACA] text-xs text-[#991B1B] dark:text-[#FCA5A5] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4 text-xs shadow-xs"
        >
          <div>
            <label className="block text-text-secondary-light dark:text-text-secondary-dark font-medium mb-1">
              Operator Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-mono focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary-light dark:text-text-secondary-dark font-medium mb-1">
              Access Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-mono focus:outline-hidden"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded font-medium text-white bg-brand hover:bg-brand-dark transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Operations Console'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* 1-Click Role Switcher for Evaluators */}
        <div className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-text-primary-light dark:text-text-primary-dark">
            <UserCheck className="w-4 h-4 text-brand" />
            <span>Instant Role Evaluation Shortcuts</span>
          </div>
          <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark">
            Click any account to immediately switch roles with full RBAC middleware authentication:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <button
              onClick={() => handleQuickDemo('PLATFORM_ADMIN')}
              className="py-1.5 px-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark hover:border-brand font-medium transition-colors"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickDemo('MESS_ADMIN')}
              className="py-1.5 px-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark hover:border-brand font-medium transition-colors"
            >
              Mess Admin
            </button>
            <button
              onClick={() => handleQuickDemo('NGO_REP')}
              className="py-1.5 px-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark hover:border-brand font-medium transition-colors"
            >
              NGO Rep
            </button>
          </div>
        </div>

        {/* Creator Attribution */}
        <div className="text-center text-xs text-text-muted-light dark:text-text-muted-dark pt-1">
          <span>Crafted with care &bull; </span>
          <a
            href="https://builtbyakshat.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand font-semibold hover:underline inline-flex items-center gap-0.5"
          >
            Built by Akshat ↗
          </a>
        </div>
      </div>
    </div>
  );
};
