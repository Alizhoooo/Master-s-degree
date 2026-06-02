import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getProfile } from '../api';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<any>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJwt(token: string): { sub?: number; email?: string; role?: string; fullName?: string } | null {
  try {
    const part = token.split('.')[1];
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      const decoded = decodeJwt(stored);
      if (decoded) {
        setToken(stored);
        setUser({
          id: Number(decoded.sub) || 0,
          email: decoded.email || '',
          fullName: decoded.fullName || '',
          role: decoded.role || 'User',
        });
      } else {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const data = await apiLogin(email, password);
    const tk = data.access_token;
    localStorage.setItem('token', tk);
    setToken(tk);
    const decoded = decodeJwt(tk);
    const u: AuthUser = {
      id: Number(decoded?.sub) || 0,
      email: decoded?.email || email,
      fullName: decoded?.fullName || '',
      role: decoded?.role || 'User',
    };
    setUser(u);
    return u;
  };

  const register = async (email: string, password: string, fullName: string, role: string) => {
    return apiRegister(email, password, fullName, role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await getProfile();
      setUser((prev) => prev ? { ...prev, ...profile } : profile);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, user, token, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
