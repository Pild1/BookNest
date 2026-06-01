const apiBaseUrl = import.meta.env.VITE_API_URL ?? '';

export async function listUsers(token) {
  return request('/api/admin/users', { token });
}

export async function updateUserRole(token, userId, role) {
  return request(`/api/admin/users/${encodeURIComponent(userId)}`, {
    token,
    method: 'PATCH',
    payload: { role },
  });
}

export async function revokeUserSessions(token, userId) {
  return request(`/api/admin/users/${encodeURIComponent(userId)}/sessions`, {
    token,
    method: 'DELETE',
  });
}

async function request(path, { token, method = 'GET', payload } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the BookNest API. Make sure the backend is running.');
  }

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || 'Admin request failed.');
  }

  return body.data;
}
