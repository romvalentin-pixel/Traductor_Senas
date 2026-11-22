import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { SECURE_TOKEN_KEY, SECURE_USER_KEY } from '../constants/config';
import * as authService from '../services/auth';
import { setAccessToken, setUnauthorizedHandler } from '../services/http';
import { deleteSecureItem, getSecureItem, setSecureItem } from '../services/storage';
import type { AuthResponse, RegisterInput, User } from '../types/api';
import { ApiError } from '../utils/errors';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(response: AuthResponse): Promise<void> {
  setAccessToken(response.access_token);
  await Promise.all([
    setSecureItem(SECURE_TOKEN_KEY, response.access_token),
    setSecureItem(SECURE_USER_KEY, JSON.stringify(response.user)),
  ]);
}

async function clearSession(): Promise<void> {
  setAccessToken(null);
  await Promise.all([
    deleteSecureItem(SECURE_TOKEN_KEY),
    deleteSecureItem(SECURE_USER_KEY),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
    setToken(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getSecureItem(SECURE_TOKEN_KEY),
          getSecureItem(SECURE_USER_KEY),
        ]);

        if (!storedToken) {
          if (!cancelled) setStatus('anonymous');
          return;
        }

        setAccessToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser) as User);
          } catch {
            // Si el JSON está corrupto se valida igual contra /auth/me.
          }
        }

        try {
          const currentUser = await authService.me();
          if (cancelled) return;
          setUser(currentUser);
          setToken(storedToken);
          setStatus('authenticated');
          await setSecureItem(SECURE_USER_KEY, JSON.stringify(currentUser));
        } catch (error) {
          if (cancelled) return;
          // Sin red se conserva la sesión guardada; con 401 se cierra.
          if (error instanceof ApiError && error.status === 401) {
            await logout();
            return;
          }
          if (storedUser) {
            setToken(storedToken);
            setStatus('authenticated');
          } else {
            await logout();
          }
        }
      } catch {
        if (!cancelled) setStatus('anonymous');
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password);
    await persistSession(response);
    setToken(response.access_token);
    setUser(response.user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(
    async (payload: RegisterInput) => {
      await authService.register(payload);
      await login(payload.email, payload.password);
    },
    [login]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
    }),
    [status, user, token, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext debe usarse dentro de <AuthProvider>');
  return context;
}
