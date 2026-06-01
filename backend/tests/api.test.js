import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { createApp } from '../src/app.js';

test('GET /api/health returns service status', async (t) => {
  const client = await startTestServer(t);
  const response = await fetch(`${client.baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
});

test('GET /api/books returns paginated books', async (t) => {
  const client = await startTestServer(t);
  const unauthenticated = await fetch(`${client.baseUrl}/api/books`);
  assert.equal(unauthenticated.status, 401);

  const response = await fetch(`${client.baseUrl}/api/books?page=1&pageSize=1&sortBy=title`, authOptions());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.length, 1);
  assert.equal(body.pagination.totalItems, 2);
  assert.equal(body.pagination.totalPages, 2);
});

test('GET /api/books/:id returns one book or 404', async (t) => {
  const client = await startTestServer(t);
  const found = await fetch(`${client.baseUrl}/api/books/book-1`, authOptions());
  const missing = await fetch(`${client.baseUrl}/api/books/unknown`, authOptions());

  assert.equal(found.status, 200);
  assert.equal((await found.json()).data.title, 'Alpha');
  assert.equal(missing.status, 404);
});

test('POST /api/books validates and creates a book', async (t) => {
  const client = await startTestServer(t);
  const invalid = await fetch(`${client.baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
    body: JSON.stringify({ title: '', author: '' }),
  });

  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).fields.title, 'Title is required.');

  const valid = await fetch(`${client.baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
    body: JSON.stringify({
      title: 'Dune',
      author: 'Frank Herbert',
      genre: 'Science Fiction',
      totalPages: 412,
      currentPage: 0,
      status: 'UNREAD',
      rating: 5,
      notes: '',
    }),
  });

  const body = await valid.json();
  assert.equal(valid.status, 201);
  assert.equal(body.data.title, 'Dune');
  assert.ok(body.data.id);
});

test('PUT and DELETE /api/books/:id update and remove a book', async (t) => {
  const client = await startTestServer(t);
  const update = await fetch(`${client.baseUrl}/api/books/book-1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
    body: JSON.stringify({
      title: 'Alpha Updated',
      author: 'Jane',
      genre: 'Fantasy',
      totalPages: 100,
      currentPage: 100,
      status: 'FINISHED',
      rating: 4,
      notes: 'Done.',
    }),
  });

  assert.equal(update.status, 200);
  assert.equal((await update.json()).data.title, 'Alpha Updated');

  const deleted = await fetch(`${client.baseUrl}/api/books/book-1`, { method: 'DELETE', headers: authOptions().headers });
  assert.equal(deleted.status, 200);
  assert.equal((await fetch(`${client.baseUrl}/api/books/book-1`, authOptions())).status, 404);
});

test('GET /api/stats returns collection statistics', async (t) => {
  const client = await startTestServer(t);
  const response = await fetch(`${client.baseUrl}/api/stats`, authOptions());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.totalBooks, 2);
  assert.equal(body.data.finished, 1);
});

async function startTestServer(t) {
  const repository = createFakeRepository();
  const authService = createFakeAuthService();
  const app = createApp({ repository, authService });
  const server = createServer(app.handleRequest);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

function authOptions() {
  return { headers: { Authorization: 'Bearer valid-token' } };
}

function createFakeAuthService() {
  return {
    async authenticate(token) {
      if (token !== 'valid-token') return null;
      return {
        id: 'user-test',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'USER',
        expiresAt: new Date(Date.now() + 1000).toISOString(),
      };
    },
    async register(user) {
      return { token: 'valid-token', user: { id: 'user-test', ...user, role: 'USER' }, expiresAt: new Date().toISOString() };
    },
    async login() {
      return { token: 'valid-token', user: { id: 'user-test', role: 'USER' }, expiresAt: new Date().toISOString() };
    },
    async logout() {},
  };
}

function createFakeRepository() {
  let books = [
    {
      id: 'book-1',
      title: 'Alpha',
      author: 'Jane',
      genre: 'Fantasy',
      coverUrl: '',
      totalPages: 100,
      currentPage: 0,
      status: 'UNREAD',
      rating: 3,
      notes: '',
      isWishlist: false,
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      loan: null,
    },
    {
      id: 'book-2',
      title: 'Beta',
      author: 'Alex',
      genre: 'Classic',
      coverUrl: '',
      totalPages: 200,
      currentPage: 200,
      status: 'FINISHED',
      rating: 5,
      notes: '',
      isWishlist: false,
      isDeleted: false,
      createdAt: '2026-01-02T00:00:00.000Z',
      loan: null,
    },
  ];

  return {
    async list(options = {}) {
      const pageSize = Number(options.pageSize || 10);
      return {
        data: books.slice(0, pageSize),
        pagination: { page: 1, pageSize, totalItems: books.length, totalPages: Math.ceil(books.length / pageSize) },
      };
    },
    async findById(id) {
      return books.find((book) => book.id === id && !book.isDeleted) ?? null;
    },
    async create(book) {
      const created = { ...book, id: 'book-created', createdAt: new Date().toISOString(), isDeleted: false };
      books.unshift(created);
      return created;
    },
    async update(id, book) {
      const index = books.findIndex((candidate) => candidate.id === id && !candidate.isDeleted);
      if (index === -1) return null;
      books[index] = { ...books[index], ...book, id };
      return books[index];
    },
    async remove(id) {
      const book = books.find((candidate) => candidate.id === id && !candidate.isDeleted);
      if (!book) return false;
      book.isDeleted = true;
      return true;
    },
    async stats() {
      const active = books.filter((book) => !book.isDeleted);
      return {
        totalBooks: active.length,
        unread: active.filter((book) => book.status === 'UNREAD').length,
        inProgress: active.filter((book) => book.status === 'IN_PROGRESS').length,
        finished: active.filter((book) => book.status === 'FINISHED').length,
        lentOut: 0,
        averageRating: 4,
        genres: { Fantasy: 1, Classic: 1 },
      };
    },
  };
}
