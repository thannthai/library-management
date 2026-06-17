/**
 * AuthContext.tsx
 * ─────────────────────────────────────────────────────────────
 * Global Authentication Context.
 *
 * Provides to the entire component tree:
 *   • user           — the current AuthUser object (null if not logged in)
 *   • isAuthenticated — derived boolean from user !== null
 *   • isLoading      — true while the initial /auth/me check is in flight
 *   • login(payload) — calls POST /auth/login, updates state on success
 *   • logout()       — calls POST /auth/logout, clears state
 *
 * On mount, the context automatically calls GET /auth/me to restore
 * the session from the HttpOnly Cookie (handles page refresh).
 * ─────────────────────────────────────────────────────────────
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

import axiosClient, {
  getMeRequest,
  loginRequest,
} from '../api/axiosClient';

import type { AuthUser, LoginRequest } from '../types/auth.types';

// ─── Context Shape ────────────────────────────────────────────────────────────

export interface AuthContextValue {
  /** The currently authenticated user, or null if not logged in */
  user: AuthUser | null;

  /** True when user !== null */
  isAuthenticated: boolean;

  /** True while the initial /auth/me check or a login/logout call is pending */
  isLoading: boolean;

  /**
   * Attempts to log in with the provided credentials.
   * On success, updates `user` and `isAuthenticated`.
   * On failure, throws so the caller can show an error message.
   */
  login: (payload: LoginRequest) => Promise<void>;

  /**
   * Calls POST /auth/logout, which instructs the backend to invalidate
   * the HttpOnly Cookie, then clears local user state.
   */
  logout: () => Promise<void>;

  /** Refresh the current user's profile details from /users/me */
  refreshUser: () => Promise<void>;
}

// ─── Context & Hook ───────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,
  login:           async () => {},
  logout:          async () => {},
  refreshUser:     async () => {},
});

/** Convenience hook — import and call inside any component */
export const useAuth = (): AuthContextValue => useContext(AuthContext);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser]                     = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setLoading]             = useState<boolean>(true);
  const navigate = useNavigate();

  // ── On app start / page refresh: restore session from cookie ──────────────
  useEffect(() => {
    getMeRequest()
      .then((userData) => {
        setUser(userData);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setUser(null);
        setIsAuthenticated(false);
      })        // 401 = not logged in — expected, not an error
      .finally(() => setLoading(false));
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (payload: LoginRequest): Promise<void> => {
    setLoading(true);
    try {
      const response = await loginRequest(payload);
      // The JWT HttpOnly Cookie is now set by the browser automatically.
      // We only store the user object from the response body.
      setUser(response.user);
      setIsAuthenticated(true);
    } finally {
      // If loginRequest throws, loading is reset so the UI is not stuck.
      setLoading(false);
    }
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // ── refreshUser ────────────────────────────────────────────────────────────
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const userData = await getMeRequest();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
