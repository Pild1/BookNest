import { Navigate } from 'react-router-dom';
import { AuthScreen } from '../components/AuthScreen';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { auth, sessionChecking, handleAuthenticated } = useAuth();

  if (sessionChecking) {
    return (
      <main className="app-shell auth-page">
        <p className="eyebrow">Verifying your session…</p>
      </main>
    );
  }

  if (auth) {
    return <Navigate to="/" replace />;
  }

  return <AuthScreen onAuthenticated={handleAuthenticated} />;
}
