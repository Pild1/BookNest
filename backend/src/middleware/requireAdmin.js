import { requireAuth } from './requireAuth.js';
import { sendJson } from '../utils/http.js';

export async function requireAdmin(request, response, authService) {
  const user = await requireAuth(request, response, authService);
  if (!user) return null;

  if (user.role !== 'ADMIN') {
    sendJson(response, 403, { error: 'Admin access required.' });
    return null;
  }

  return user;
}
