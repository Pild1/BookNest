import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBookPayload } from '../src/validation/bookValidation.js';

test('validates and normalizes a correct book payload', () => {
  const result = validateBookPayload({
    title: ' Dune ',
    author: ' Frank Herbert ',
    isbn: '9780441172719',
    genre: 'Science Fiction',
    coverUrl: 'https://example.com/dune.jpg',
    totalPages: '412',
    currentPage: '120',
    status: 'in_progress',
    rating: '5',
    notes: 'Classic.',
  });

  assert.equal(result.isValid, true);
  assert.equal(result.book.title, 'Dune');
  assert.equal(result.book.status, 'IN_PROGRESS');
  assert.equal(result.book.totalPages, 412);
  assert.equal(result.book.rating, 5);
});

test('rejects missing title and author', () => {
  const result = validateBookPayload({
    title: '',
    author: '',
    totalPages: 100,
    currentPage: 0,
    status: 'UNREAD',
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.title, 'Title is required.');
  assert.equal(result.errors.author, 'Author is required.');
});

test('rejects impossible progress and rating values', () => {
  const result = validateBookPayload({
    title: 'Bad Book',
    author: 'Nobody',
    totalPages: 100,
    currentPage: 120,
    status: 'IN_PROGRESS',
    rating: 6,
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.currentPage, 'Current page cannot exceed total pages.');
  assert.equal(result.errors.rating, 'Rating must be an integer from 1 to 5.');
});

test('enforces status-specific progress rules', () => {
  const unread = validateBookPayload({
    title: 'Unread',
    author: 'Author',
    totalPages: 100,
    currentPage: 1,
    status: 'UNREAD',
  });

  const finished = validateBookPayload({
    title: 'Finished',
    author: 'Author',
    totalPages: 100,
    currentPage: 99,
    status: 'FINISHED',
  });

  assert.equal(unread.errors.currentPage, 'Unread books must have currentPage set to 0.');
  assert.equal(finished.errors.currentPage, 'Finished books must have currentPage equal to totalPages.');
});
