import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, LogOut, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AppLayout() {
  const { auth, handleLogout, isAdmin } = useAuth();

  return (
    <main className="app-shell">
      <header className="session-bar">
        <span>
          Signed in as <strong>{auth.user.displayName}</strong> ({auth.user.role})
          {auth.expiresAt && (
            <span className="session-meta"> · session until {new Date(auth.expiresAt).toLocaleTimeString()}</span>
          )}
        </span>
        <div className="session-actions">
          <nav className="app-nav" aria-label="Main navigation">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
              <BookOpen size={18} aria-hidden="true" />
              Library
            </NavLink>
            {isAdmin && (
              <NavLink to="/account" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                <Users size={18} aria-hidden="true" />
                Accounts
              </NavLink>
            )}
          </nav>
          <button className="button secondary" type="button" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" />
            Logout
          </button>
        </div>
      </header>
      <Outlet />
    </main>
  );
}
