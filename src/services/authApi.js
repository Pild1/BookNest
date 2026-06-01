// Empty base URL uses the Vite dev proxy (/api -> backend). Set VITE_API_URL for LAN/remote backends.
const apiBaseUrl = import.meta.env.VITE_API_URL ?? '';

export async function login(credentials) {
  return postAuth('/api/auth/login', credentials);
}

export async function register(user) {
  return postAuth('/api/auth/register', user);
}

export async function logout(token) {
  if (!token) return;
  await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchCurrentUser(token) {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json();

  if (!response.ok) {
    return null;
  }

  return body.data.user;
}

async function postAuth(path, payload) {
  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      'Cannot reach the BookNest API. Run "npm run backend" in a separate terminal, then restart "npm run dev".',
    );
  }

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || 'Authentication failed.');
  }

  return body.data;
}
