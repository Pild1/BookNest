import { useEffect, useRef } from 'react';
import { fetchCurrentUser } from '../services/authApi';

const sessionIdleMinutes = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES || 30);
const inactivityLimitMs = sessionIdleMinutes * 60 * 1000;
const activitySyncMs = 60 * 1000;

export function useSessionManager(auth, setAuth, onLogout) {
  const lastActivityRef = useRef(Date.now());
  const lastSyncRef = useRef(0);

  useEffect(() => {
    if (!auth?.token) return undefined;

    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['click', 'keydown', 'mousemove', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, markActivity));

    const interval = window.setInterval(async () => {
      const now = Date.now();
      const idleFor = now - lastActivityRef.current;

      if (auth.expiresAt && now > new Date(auth.expiresAt).getTime()) {
        onLogout();
        return;
      }

      if (idleFor > inactivityLimitMs) {
        onLogout();
        return;
      }

      if (now - lastSyncRef.current < activitySyncMs) return;
      lastSyncRef.current = now;

      const user = await fetchCurrentUser(auth.token);
      if (!user) {
        onLogout();
        return;
      }

      setAuth((current) =>
        current
          ? {
              ...current,
              user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
              },
              expiresAt: user.expiresAt,
            }
          : current,
      );
    }, 5000);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      window.clearInterval(interval);
    };
  }, [auth?.token, auth?.expiresAt, onLogout, setAuth]);
}
