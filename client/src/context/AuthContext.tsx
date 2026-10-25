import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, AUTH_EXPIRED_EVENT, TOKEN_STORAGE_KEY } from '../api/client';

export type UserRole = 'MESS_ADMIN' | 'NGO_REP' | 'PLATFORM_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  organizationId?: string;
  organization?: any;
}

/**
 * Seeded demo accounts used by the evaluator shortcuts. These are real accounts:
 * the shortcut performs a normal login against the backend, so the server issues
 * a signed token and enforces role permissions exactly as for a typed login.
 */
export const DEMO_ACCOUNTS: Record<UserRole, { email: string; password: string }> = {
  PLATFORM_ADMIN: { email: 'platform.admin@foodbridge.org', password: 'Pass1234!' },
  MESS_ADMIN: { email: 'mess.admin@foodbridge.org', password: 'Pass1234!' },
  NGO_REP: { email: 'ngo.rep@foodbridge.org', password: 'Pass1234!' },
};

/** Landing page for each role after sign-in. */
export const ROLE_HOME: Record<UserRole, string> = {
  MESS_ADMIN: '/mess/report',
  NGO_REP: '/ngo/donations',
  PLATFORM_ADMIN: '/admin/overview',
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  switchDemoRole: (role: UserRole) => Promise<User>;
  logout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  // True until a stored token has been checked against /auth/me.
  const [isLoading, setIsLoading] = useState<boolean>(!!localStorage.getItem(TOKEN_STORAGE_KEY));
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem('foodbridge_theme') === 'dark'
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('foodbridge_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('foodbridge_demo_role'); // legacy key from the no-auth demo mode
    setToken(null);
    setUser(null);
  }, []);

  // Restore the session from a stored token on page load.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    apiRequest<User>('/auth/me')
      .then(u => setUser(u))
      .catch((err: any) => {
        console.warn('[Auth] Stored session is not valid:', err.message);
        clearSession();
      })
      .finally(() => setIsLoading(false));
  }, [clearSession]);

  // Any API call that comes back 401 (expired/invalid token) signs the user out,
  // which sends them to the login page via the route guard.
  useEffect(() => {
    const onExpired = () => clearSession();
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [clearSession]);

  // Throws on failure so callers can show the real error.
  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const switchDemoRole = async (role: UserRole): Promise<User> => {
    const account = DEMO_ACCOUNTS[role];
    return login(account.email, account.password);
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        switchDemoRole,
        logout,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
