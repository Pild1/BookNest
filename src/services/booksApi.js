import { mapBookFromApi, mapBookToApi } from './bookMappers.js';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? '';

export async function listBooks(token, options = {}) {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 100),
    sortBy: options.sortBy ?? 'title',
    direction: options.direction ?? 'asc',
  });

  const body = await request(`/api/books?${params}`, { token });
  return body.data.map(mapBookFromApi);
}

export async function createBook(token, book) {
  const body = await request('/api/books', {
    token,
    method: 'POST',
    payload: mapBookToApi(book),
  });
  return mapBookFromApi(body.data);
}

export async function updateBook(token, id, book) {
  const body = await request(`/api/books/${encodeURIComponent(id)}`, {
    token,
    method: 'PUT',
    payload: mapBookToApi(book),
  });
  return mapBookFromApi(body.data);
}

export async function deleteBook(token, id) {
  await request(`/api/books/${encodeURIComponent(id)}`, { token, method: 'DELETE' });
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
    const fieldMessage = body.fields ? Object.values(body.fields).join(' ') : '';
    throw new Error(body.error || fieldMessage || 'Book request failed.');
  }

  return body;
}
