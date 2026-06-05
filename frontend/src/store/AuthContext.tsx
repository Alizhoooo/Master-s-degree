import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { login as apiLogin, loginVerifyTotp as apiLoginVerifyTotp, register as apiRegister, logout as apiLogout, refreshAccessToken } from '../api';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginResult {
  user: AuthUser;
  requiresTotp?: boolean;
  userId?: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyTotpLogin: (userId: number, token: string) => Promise<AuthUser>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setupTotp: () => Promise<{ secret: string; qrCode: string }>;
  verifyTotpSetup: (token: string) => Promise<void>;
  disableTotp: (password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJwt(token: string): Record<string, any> | null {
  try {
    const part = token.split('.')[1];
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}

let refreshPromise: Promise<string | null> | null = null;

async function doRefreshToken(): Promise<string | null> {
  try {
    const data = await refreshAccessToken();
    return data.accessToken || data.access_token || data.token || null;
  } catch {
    localStorage.removeItem('token');
    return null;
  }
}

export function refreshTokenIfNeeded(): Promise<string | null> {
  const token = localStorage.getItem('token');
  if (!token) return Promise.resolve(null);
  if (!isTokenExpired(token)) return Promise.resolve(token);
  if (!refreshPromise) {
    refreshPromise = doRefreshToken().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const refreshInterval = useRef<ReturnType<typeof setInterval>>();

  const syncFromToken = useCallback((tk: string | null) => {
    if (!tk) {
      setToken(null);
      setUser(null);
      return;
    }
    const decoded = decodeJwt(tk);
    if (!decoded || isTokenExpired(tk)) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return;
    }
    setToken(tk);
    setUser({
      id: Number(decoded.sub) || 0,
      email: decoded.email || '',
      fullName: decoded.fullName || '',
      role: decoded.role || 'User',
    });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    syncFromToken(stored);

    const check = async () => {
      const tk = localStorage.getItem('token');
      if (tk && isTokenExpired(tk)) {
        const newToken = await doRefreshToken();
        if (newToken) {
          localStorage.setItem('token', newToken);
          syncFromToken(newToken);
        } else {
          syncFromToken(null);
        }
      }
    };
    refreshInterval.current = setInterval(check, 60000);
    return () => clearInterval(refreshInterval.current);
  }, [syncFromToken]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const data = await apiLogin(email, password);
    if (data.requiresTotp) {
      return { user: null as any, requiresTotp: true, userId: data.userId };
    }
    const tk = data.accessToken || data.access_token || data.token;
    localStorage.setItem('token', tk);
    syncFromToken(tk);
    return { user: data.user };
  };

  const verifyTotpLogin = async (userId: number, totpToken: string): Promise<AuthUser> => {
    const data = await apiLoginVerifyTotp(userId, totpToken);
    const tk = data.accessToken || data.access_token || data.token;
    localStorage.setItem('token', tk);
    syncFromToken(tk);
    return data.user;
  };

  const register = async (email: string, password: string, fullName: string, role: string) => {
    return apiRegister(email, password, fullName, role);
  };

  const logout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const { getProfile } = await import('../api');
    try {
      const profile = await getProfile();
      setUser((prev) => prev ? { ...prev, ...profile } : profile);
    } catch { /* ignore */ }
  };

  const setupTotp = async () => {
    const { setupTotp: api } = await import('../api');
    return api();
  };

  const verifyTotpSetup = async (totpToken: string) => {
    const { verifyTotpSetup: api } = await import('../api');
    await api(totpToken);
  };

  const disableTotp = async (password: string) => {
    const { disableTotp: api } = await import('../api');
    await api(password);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const { changePassword: api } = await import('../api');
    await api(currentPassword, newPassword);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!token,
      user,
      token,
      login,
      verifyTotpLogin,
      register,
      logout,
      refreshProfile,
      setupTotp,
      verifyTotpSetup,
      disableTotp,
      changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
