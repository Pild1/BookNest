import { describe, expect, it } from 'vitest';
import { mapBookFromApi, mapBookToApi } from './bookMappers';

describe('bookMappers', () => {
  it('maps API status values to UI labels and back', () => {
    const apiBook = {
      id: 'book-1',
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '',
      genre: 'Science Fiction',
      coverUrl: '',
      totalPages: 412,
      currentPage: 0,
      status: 'UNREAD',
      rating: null,
      notes: '',
      isWishlist: false,
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      loan: null,
    };

    const uiBook = mapBookFromApi(apiBook);
    expect(uiBook.status).toBe('Unread');
    expect(mapBookToApi(uiBook).status).toBe('UNREAD');
  });
});
