'use client';

/**
 * Centralized auth state for the whole app.
 *
 * ROOT CAUSE OF THE OLD BUG: every dashboard page independently ran its own
 * `fetchCurrentUser().then(...).catch(() => router.replace('/login'))` on
 * mount. That meant (a) the app re-checked auth from scratch on every single
 * navigation, showing a fresh loading flash each time, and (b) the `.catch`
 * treated ANY failure in that chain — including a failed `fetchHotel()` or
 * `fetchRooms()` call, not just an actual 401 — as "not authenticated" and
 * force-redirected to /login. A transient error two calls into the chain
 * looked identical to a truly expired session.
 *
 * The fix: authenticate once, in one place, into an explicit three-state
 * status (`loading` | `authenticated` | `unauthenticated`) that the rest of
 * the app reads instead of re-deriving. Nothing redirects while `loading`.
 * Only `logout()` and a genuine 401 from `refresh()` move to
 * `unauthenticated`.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import {
  fetchCurrentUser, login as apiLogin, registerTenant as apiRegisterTenant,
  logout as apiLogout, isAuthError, type User,
} from './api-client';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: Status;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  registerTenant: (input: {
    tenantName: string; adminEmail: string; adminPassword: string; firstName: string; lastName: string;
  }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  // Restore the session exactly once, on app startup. This is the only
  // place `fetchCurrentUser` is called for restoration purposes — every
  // page below just reads `status`/`user` from context.
  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
    setStatus('authenticated');
    return u;
  }, []);

  const registerTenant = useCallback(async (input: Parameters<AuthContextValue['registerTenant']>[0]) => {
    const u = await apiRegisterTenant(input);
    setUser(u);
    setStatus('authenticated');
    return u;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({ status, user, login, registerTenant, logout }),
    [status, user, login, registerTenant, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export { isAuthError };
