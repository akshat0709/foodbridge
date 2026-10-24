import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

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

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('foodbridge_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
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

  useEffect(() => {
    if (token) {
      apiRequest<User>('/auth/me')
        .then(u => setUser(u))
        .catch(() => {
          localStorage.removeItem('foodbridge_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('foodbridge_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const switchDemoRole = async (role: UserRole) => {
    setIsLoading(true);
    let email = 'platform.admin@foodbridge.org';
    if (role === 'MESS_ADMIN') email = 'mess.admin@foodbridge.org';
    if (role === 'NGO_REP') email = 'ngo.rep@foodbridge.org';

    try {
      await login(email, 'Pass1234!');
    } catch (e) {
      console.error('Demo switch failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('foodbridge_token');
    setToken(null);
    setUser(null);
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
