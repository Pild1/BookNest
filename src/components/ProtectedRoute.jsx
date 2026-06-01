import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { auth, sessionChecking } = useAuth();
  const location = useLocation();

  if (sessionChecking) {
    return (
      <main className="app-shell auth-page">
        <p className="eyebrow">Verifying your session…</p>
      </main>
    );
  }

  if (!auth) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
