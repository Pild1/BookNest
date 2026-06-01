import { validateBookPayload } from '../validation/bookValidation.js';
import { getIdFromPath, readJson, sendJson } from '../utils/http.js';

const basePath = '/api/books';

export function createBooksRouter(store) {
  return async function booksRouter(request, response, url, user) {
    const id = getIdFromPath(url.pathname, basePath);

    if (request.method === 'GET' && !id) {
      const result = await store.list({
        userId: user.id,
        page: url.searchParams.get('page'),
        pageSize: url.searchParams.get('pageSize'),
        search: url.searchParams.get('search'),
        status: url.searchParams.get('status'),
        genre: url.searchParams.get('genre'),
        sortBy: url.searchParams.get('sortBy'),
        direction: url.searchParams.get('direction'),
      });
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'GET' && id) {
      const book = await store.findById(id, user.id);
      if (!book) {
        sendJson(response, 404, { error: 'Book not found.' });
        return;
      }
      sendJson(response, 200, { data: book });
      return;
    }

    if (request.method === 'POST' && !id) {
      const payload = await readJson(request);
      const validation = validateBookPayload(payload);

      if (!validation.isValid) {
        sendJson(response, 400, { error: 'Validation failed.', fields: validation.errors });
        return;
      }

      sendJson(response, 201, { data: await store.create(validation.book, user.id) });
      return;
    }

    if (request.method === 'PUT' && id) {
      const payload = await readJson(request);
      const validation = validateBookPayload(payload);

      if (!validation.isValid) {
        sendJson(response, 400, { error: 'Validation failed.', fields: validation.errors });
        return;
      }

      const book = await store.update(id, validation.book, user.id);
      if (!book) {
        sendJson(response, 404, { error: 'Book not found.' });
        return;
      }

      sendJson(response, 200, { data: book });
      return;
    }

    if (request.method === 'DELETE' && id) {
      const deleted = await store.remove(id, user.id);
      if (!deleted) {
        sendJson(response, 404, { error: 'Book not found.' });
        return;
      }

      sendJson(response, 200, { data: { id, deleted: true } });
      return;
    }

    sendJson(response, 405, { error: 'Method not allowed for /api/books.' });
  };
}
