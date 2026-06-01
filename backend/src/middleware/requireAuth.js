import { extractBearerToken } from '../routes/authRoutes.js';
import { sendJson } from '../utils/http.js';

export async function requireAuth(request, response, authService) {
  const user = await authService.authenticate(extractBearerToken(request));
  if (!user) {
    sendJson(response, 401, { error: 'Authentication required.' });
    return null;
  }
  return user;
}
