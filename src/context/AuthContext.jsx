import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionManager } from '../hooks/useSessionManager';
import { fetchCurrentUser, logout } from '../services/authApi';

const authStorageKey = 'booknest-auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(() => readStoredAuth());
  const [sessionChecking, setSessionChecking] = useState(Boolean(readStoredAuth()));

  const handleLogout = useCallback(async () => {
    const token = auth?.token;
    localStorage.removeItem(authStorageKey);
    setAuth(null);
    if (token) await logout(token).catch(() => {});
    navigate('/login', { replace: true });
  }, [auth?.token, navigate]);

  useSessionManager(auth, setAuth, handleLogout);

  useEffect(() => {
    if (!auth?.token) {
      setSessionChecking(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      const user = await fetchCurrentUser(auth.token);
      if (cancelled) return;

      if (!user) {
        await handleLogout();
        return;
      }

      const nextAuth = {
        token: auth.token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        expiresAt: user.expiresAt,
      };
      localStorage.setItem(authStorageKey, JSON.stringify(nextAuth));
      setAuth(nextAuth);
      setSessionChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthenticated = useCallback(
    (result) => {
      const nextAuth = { token: result.token, user: result.user, expiresAt: result.expiresAt };
      localStorage.setItem(authStorageKey, JSON.stringify(nextAuth));
      setAuth(nextAuth);
      setSessionChecking(false);
      navigate('/', { replace: true });
    },
    [navigate],
  );

  const value = useMemo(
    () => ({
      auth,
      sessionChecking,
      isAdmin: auth?.user?.role === 'ADMIN',
      handleAuthenticated,
      handleLogout,
    }),
    [auth, sessionChecking, handleAuthenticated, handleLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function readStoredAuth() {
  try {
    const stored = JSON.parse(localStorage.getItem(authStorageKey));
    if (!stored?.token || !stored?.user) return null;
    return stored;
  } catch {
    return null;
  }
}
