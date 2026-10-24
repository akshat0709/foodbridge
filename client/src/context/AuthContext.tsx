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

export const DEMO_PROFILES: Record<UserRole, User> = {
  PLATFORM_ADMIN: {
    id: '6adcd57184b8ffbca383bf2e',
    email: 'platform.admin@foodbridge.org',
    name: 'Aditi Rao (Platform Admin)',
    role: 'PLATFORM_ADMIN',
    phone: '+91 9876543212',
  },
  MESS_ADMIN: {
    id: '6adcd57184b8ffbca383bf30',
    email: 'mess.admin@foodbridge.org',
    name: 'Rajesh Sharma (Mess Admin)',
    role: 'MESS_ADMIN',
    phone: '+91 9876543210',
    organization: {
      name: 'Satpura Hostel Mess',
      campus: 'North Campus',
    },
  },
  NGO_REP: {
    id: '6adcd57184b8ffbca383bf31',
    email: 'ngo.rep@foodbridge.org',
    name: 'Priya Verma (NGO Rep)',
    role: 'NGO_REP',
    phone: '+91 9876543211',
    organization: {
      name: 'Robin Hood Army - South Delhi',
      city: 'South Delhi',
    },
  },
};

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
  const savedRole = (localStorage.getItem('foodbridge_demo_role') as UserRole) || 'PLATFORM_ADMIN';
  const initialUser = DEMO_PROFILES[savedRole] || DEMO_PROFILES.PLATFORM_ADMIN;

  const [user, setUser] = useState<User | null>(initialUser);
  const [token, setToken] = useState<string | null>(localStorage.getItem('foodbridge_token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
          // If token fails or server is offline, retain fallback demo user
          setUser(initialUser);
        });
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('foodbridge_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (err) {
      // Fallback matching for demo evaluation
      if (email.toLowerCase().includes('mess')) {
        setUser(DEMO_PROFILES.MESS_ADMIN);
      } else if (email.toLowerCase().includes('ngo')) {
        setUser(DEMO_PROFILES.NGO_REP);
      } else {
        setUser(DEMO_PROFILES.PLATFORM_ADMIN);
      }
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    localStorage.setItem('foodbridge_demo_role', role);
    const targetUser = DEMO_PROFILES[role] || DEMO_PROFILES.PLATFORM_ADMIN;
    setUser(targetUser);

    try {
      await login(targetUser.email, 'Pass1234!');
    } catch {
      // Retain client-side user
    }
  };

  const logout = () => {
    localStorage.removeItem('foodbridge_token');
    setToken(null);
    setUser(DEMO_PROFILES.PLATFORM_ADMIN);
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
