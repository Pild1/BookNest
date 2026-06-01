import { sendJson } from '../utils/http.js';

export function createStatsRouter(store) {
  return async function statsRouter(request, response, url, user) {
    if (request.method !== 'GET') {
      sendJson(response, 405, { error: 'Method not allowed for /api/stats.' });
      return;
    }

    sendJson(response, 200, { data: await store.stats(user.id) });
  };
}
