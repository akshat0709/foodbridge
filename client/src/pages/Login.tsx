import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME, UserRole } from '../context/AuthContext';
import { AlertCircle, ChefHat, Truck, LineChart, Loader2 } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';

const DEMO_ROLES: { role: UserRole; title: string; who: string; does: string; icon: React.ReactNode }[] = [
  {
    role: 'MESS_ADMIN',
    title: 'Mess manager',
    who: 'Satpura Hostel Mess',
    does: 'Post leftover food after a meal and log what was cooked.',
    icon: <ChefHat className="w-5 h-5" />,
  },
  {
    role: 'NGO_REP',
    title: 'NGO coordinator',
    who: 'Robin Hood Army, South Delhi',
    does: 'Claim food near you and track each pickup to hand-off.',
    icon: <Truck className="w-5 h-5" />,
  },
  {
    role: 'PLATFORM_ADMIN',
    title: 'Platform admin',
    who: 'All 60 messes and 25 NGOs',
    does: 'Watch waste trends, tune matching and export reports.',
    icon: <LineChart className="w-5 h-5" />,
  },
];

export const Login: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from as string | undefined;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'form' | UserRole | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('form');
    setError(null);
    try {
      const u = await login(email, password);
      navigate(redirectTo && redirectTo !== '/login' ? redirectTo : ROLE_HOME[u.role], { replace: true });
    } catch (err: any) {
      setError(err.message || 'Sign-in failed. Check your email and password.');
    } finally {
      setBusy(null);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setBusy(role);
    setError(null);
    try {
      const u = await switchDemoRole(role);
      navigate(ROLE_HOME[u.role], { replace: true });
    } catch (err: any) {
      setError(err.message || 'Could not open the demo account.');
    } finally {
      setBusy(null);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-[15px] text-text-primary-light dark:text-text-primary-dark placeholder:text-text-muted-light/70 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors';

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,1fr)] bg-bg-light dark:bg-bg-dark">
      {/* Photo panel */}
      <section className="relative overflow-hidden bg-brand-deep min-h-[300px] lg:min-h-screen" aria-label="About FoodBridge">
        <img
          src="/images/hero-community-meal.webp"
          alt="Volunteers serving rice and dal from large steel pots to a queue of people outdoors"
          className="fb-settle absolute inset-0 w-full h-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F15] via-[#0B1F15]/55 to-[#0B1F15]/10" />

        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 text-white">
          <div className="flex items-center gap-2.5">
            <BrandMark className="w-9 h-9" />
            <span className="font-display text-xl font-semibold tracking-tight">FoodBridge</span>
          </div>

          <div className="max-w-xl pt-24 lg:pt-0">
            <h1
              className="font-display text-[clamp(2.25rem,4.6vw,4rem)] leading-[0.98] font-bold text-white"
              style={{ fontVariationSettings: "'wdth' 78" }}
            >
              Cooked too much tonight? Someone nearby can still eat it.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/80 max-w-md leading-relaxed">
              Hostel messes post their leftover food here. Partner NGOs within reach claim it and collect it before it
              spoils.
            </p>
            <p className="mt-10 text-xs text-white/55">Photo: community meal service, via Unsplash</p>
          </div>
        </div>
      </section>

      {/* Sign-in panel */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <h2 className="text-3xl text-text-primary-light dark:text-text-primary-dark">Sign in</h2>
          <p className="mt-1.5 text-text-secondary-light dark:text-text-secondary-dark">
            Use your FoodBridge account, or open one of the demo accounts below.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 p-3.5 rounded-md bg-danger-light dark:bg-[#4A1F17] border border-[#EFC5BB] dark:border-[#8E3322] text-sm text-danger-dark dark:text-[#F0A895] flex gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@foodbridge.org"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy !== null}
              className="w-full py-2.5 rounded-md font-semibold text-white bg-brand hover:bg-brand-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy === 'form' && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy === 'form' ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-10">
            <h3 className="text-lg text-text-primary-light dark:text-text-primary-dark">Try a demo account</h3>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-0.5">
              Each one signs in for real, with that role's permissions.
            </p>

            <ul className="mt-4 divide-y divide-border-light dark:divide-border-dark border-y border-border-light dark:border-border-dark">
              {DEMO_ROLES.map(d => (
                <li key={d.role}>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo(d.role)}
                    disabled={busy !== null}
                    className="group w-full text-left py-3.5 flex gap-3.5 items-start hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark -mx-2 px-2 rounded-md transition-colors disabled:opacity-60"
                  >
                    <span className="mt-0.5 w-9 h-9 rounded-md bg-brand-light dark:bg-[#1B3A2A] text-brand dark:text-[#9FD4B2] flex items-center justify-center shrink-0">
                      {busy === d.role ? <Loader2 className="w-5 h-5 animate-spin" /> : d.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-text-primary-light dark:text-text-primary-dark group-hover:text-brand dark:group-hover:text-[#9FD4B2]">
                          {d.title}
                        </span>
                        <span className="text-sm text-text-muted-light dark:text-text-muted-dark">{d.who}</span>
                      </span>
                      <span className="block text-sm text-text-secondary-light dark:text-text-secondary-dark leading-snug">
                        {d.does}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-10 text-sm text-text-muted-light dark:text-text-muted-dark">
            Built by{' '}
            <a
              href="https://builtbyakshat.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand dark:text-[#9FD4B2] hover:underline"
            >
              Akshat
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};
