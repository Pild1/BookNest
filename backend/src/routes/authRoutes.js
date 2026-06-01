import { validateLoginPayload, validateRegisterPayload } from '../validation/authValidation.js';
import { readJson, sendJson } from '../utils/http.js';

export function createAuthRouter(authService) {
  return async function authRouter(request, response, url) {
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      const validation = validateRegisterPayload(await readJson(request));
      if (!validation.isValid) {
        sendJson(response, 400, { error: 'Validation failed.', fields: validation.errors });
        return;
      }

      try {
        sendJson(response, 201, { data: await authService.register(validation.user) });
      } catch (error) {
        sendJson(response, error.statusCode || 500, { error: error.message });
      }
      return;
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      const validation = validateLoginPayload(await readJson(request));
      if (!validation.isValid) {
        sendJson(response, 400, { error: 'Validation failed.', fields: validation.errors });
        return;
      }

      try {
        sendJson(response, 200, { data: await authService.login(validation.credentials) });
      } catch (error) {
        sendJson(response, error.statusCode || 500, { error: error.message });
      }
      return;
    }

    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      await authService.logout(extractBearerToken(request));
      sendJson(response, 200, { data: { loggedOut: true } });
      return;
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      const user = await authService.authenticate(extractBearerToken(request));
      if (!user) {
        sendJson(response, 401, { error: 'Authentication required.' });
        return;
      }
      sendJson(response, 200, { data: { user } });
      return;
    }

    sendJson(response, 404, { error: 'Authentication endpoint not found.' });
  };
}

export function extractBearerToken(request) {
  const header = request.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}
