import { useCallback, useEffect, useState } from 'react';
import { Shield, Users } from 'lucide-react';
import { listUsers, revokeUserSessions, updateUserRole } from '../services/adminApi';

export function AccountManagement({ token, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setUsers(await listUsers(token));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId, role) => {
    setMessage('');
    setError('');

    try {
      await updateUserRole(token, userId, role);
      setMessage('User role updated. Active sessions now use the new permissions.');
      await loadUsers();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const handleRevokeSessions = async (userId) => {
    if (!window.confirm('Revoke all active sessions for this user? They will need to sign in again.')) return;

    setMessage('');
    setError('');

    try {
      const result = await revokeUserSessions(token, userId);
      setMessage(`Revoked ${result.revokedCount} active session(s).`);
      await loadUsers();
    } catch (revokeError) {
      setError(revokeError.message);
    }
  };

  return (
    <section className="admin-section" aria-labelledby="admin-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Admin only</p>
          <h2 id="admin-title">Account management</h2>
          <p className="tagline">Manage user roles and token-based sessions.</p>
        </div>
      </div>

      {error && <p className="auth-error" role="alert">{error}</p>}
      {message && <p className="admin-message" role="status">{message}</p>}
      {loading && <p className="eyebrow">Loading accounts…</p>}

      {!loading && (
        <div className="admin-table-wrap">
          <table className="admin-table" aria-label="User accounts">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Books</th>
                <th scope="col">Active sessions</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.displayName}</strong>
                    <span className="admin-meta">{user.email}</span>
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`role-${user.id}`}>
                      Role for {user.displayName}
                    </label>
                    <select
                      id={`role-${user.id}`}
                      value={user.role}
                      onChange={(event) => handleRoleChange(user.id, event.target.value)}
                      disabled={user.id === currentUserId && user.role === 'ADMIN'}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>{user.bookCount}</td>
                  <td>
                    {user.activeSessions.length === 0 ? (
                      <span>None</span>
                    ) : (
                      <ul className="session-list">
                        {user.activeSessions.map((session) => (
                          <li key={session.id}>
                            <Shield size={14} aria-hidden="true" />
                            {session.role} · expires {formatDate(session.expiresAt)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    <button
                      className="button secondary compact"
                      type="button"
                      onClick={() => handleRevokeSessions(user.id)}
                      disabled={user.activeSessions.length === 0}
                    >
                      <Users size={16} aria-hidden="true" />
                      Revoke sessions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}
