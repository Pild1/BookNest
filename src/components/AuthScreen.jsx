import { useState } from 'react';
import { BookOpen, LogIn, UserPlus } from 'lucide-react';
import { login, register } from '../services/authApi';

export function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result =
        mode === 'login'
          ? await login({ email: form.email, password: form.password })
          : await register({ email: form.email, password: form.password, displayName: form.displayName });
      onAuthenticated(result);
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-label="Authentication">
        <div className="brand-mark" aria-label="BookNest logo">
          <BookOpen size={34} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">Secure user access</p>
          <h1>BookNest</h1>
          <p className="tagline">Your personal library, reimagined.</p>
        </div>

        <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
            <LogIn size={18} aria-hidden="true" />
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
            <UserPlus size={18} aria-hidden="true" />
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label>
              <span>Display name</span>
              <input
                aria-label="Display name"
                value={form.displayName}
                onChange={(event) => update('displayName', event.target.value)}
                required
              />
            </label>
          )}
          <label>
            <span>Email</span>
            <input
              aria-label="Email"
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              aria-label="Password"
              type="password"
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
              required
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button primary" type="submit" disabled={isSubmitting}>
            {mode === 'login' ? <LogIn size={18} aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}
            {isSubmitting ? 'Please wait' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}
