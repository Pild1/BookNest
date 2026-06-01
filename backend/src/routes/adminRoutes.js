import { getIdFromPath, readJson, sendJson } from '../utils/http.js';

const usersBasePath = '/api/admin/users';

export function createAdminRouter(userAdminService) {
  return async function adminRouter(request, response, url, admin) {
    const userId = getIdFromPath(url.pathname, usersBasePath);
    const isSessionsRoute = userId && url.pathname.endsWith('/sessions');

    if (request.method === 'GET' && url.pathname === usersBasePath) {
      sendJson(response, 200, { data: await userAdminService.listUsers() });
      return;
    }

    if (request.method === 'PATCH' && userId && !isSessionsRoute) {
      const payload = await readJson(request);
      const role = payload.role;

      if (!role) {
        sendJson(response, 400, { error: 'Validation failed.', fields: { role: 'Role is required.' } });
        return;
      }

      try {
        const user = await userAdminService.updateUserRole(userId, role, admin.id);
        sendJson(response, 200, { data: user });
      } catch (error) {
        sendJson(response, error.statusCode || 500, { error: error.message });
      }
      return;
    }

    if (request.method === 'DELETE' && isSessionsRoute) {
      try {
        const result = await userAdminService.revokeUserSessions(userId);
        sendJson(response, 200, { data: result });
      } catch (error) {
        sendJson(response, error.statusCode || 500, { error: error.message });
      }
      return;
    }

    sendJson(response, 404, { error: 'Admin endpoint not found.' });
  };
}
