import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { LoginInput, LoginResponse, User } from '../services/api';
import * as api from '../services/api';

type AuthState = {
  user: User | null;
  tenant: api.Tenant | null;
  roles: string[];
  permissions: string[]; // Format: "resource:action" e.g., "ticket:read"
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEYS = {
  user: 'user',
  tenant: 'tenant',
  roles: 'roles',
  permissions: 'permissions',
} as const;

function loadStored(): Partial<AuthState> {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.user);
    const tenantStr = localStorage.getItem(STORAGE_KEYS.tenant);
    const rolesStr = localStorage.getItem(STORAGE_KEYS.roles);
    const permissionsStr = localStorage.getItem(STORAGE_KEYS.permissions);
    return {
      user: userStr ? JSON.parse(userStr) : null,
      tenant: tenantStr ? JSON.parse(tenantStr) : null,
      roles: rolesStr ? JSON.parse(rolesStr) : [],
      permissions: permissionsStr ? JSON.parse(permissionsStr) : [],
    };
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = loadStored();
    const token = api.getAccessToken();
    return {
      user: stored.user ?? null,
      tenant: stored.tenant ?? null,
      roles: stored.roles ?? [],
      permissions: stored.permissions ?? [],
      accessToken: token,
      isLoading: true,
      isAuthenticated: !!token,
    };
  });

  const applyLogin = useCallback((data: LoginResponse) => {
    api.setTokens(data.access_token, data.refresh_token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
    if (data.tenant) {
      localStorage.setItem(STORAGE_KEYS.tenant, JSON.stringify(data.tenant));
    } else {
      localStorage.removeItem(STORAGE_KEYS.tenant);
    }
    localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(data.roles));
    localStorage.setItem(STORAGE_KEYS.permissions, JSON.stringify(data.permissions || []));
    setState({
      user: data.user,
      tenant: data.tenant ?? null,
      roles: data.roles,
      permissions: data.permissions || [],
      accessToken: data.access_token,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(() => {
    api.clearTokens();
    setState({
      user: null,
      tenant: null,
      roles: [],
      permissions: [],
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  // On mount: restore session from localStorage when we have an access token.
  // Do NOT call refresh on every page load — refresh is only for when the access token expires (e.g. after 401).
  useEffect(() => {
    const token = api.getAccessToken();
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    const stored = loadStored();
    setState({
      user: stored.user ?? null,
      tenant: stored.tenant ?? null,
      roles: stored.roles ?? [],
      permissions: stored.permissions ?? [],
      accessToken: token,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  // Guard: on 401 or expired token, clear session and redirect to login.
  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      logout();
      window.location.href = '/login';
    });
    return () => api.setUnauthorizedHandler(() => {});
  }, [logout]);

  const login = useCallback(
    async (input: LoginInput) => {
      const data = await api.login(input);
      applyLogin(data);
    },
    [applyLogin]
  );

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
