import { describe, expect, it } from 'vitest';
import { filterAndSortBooks, paginate } from './filterBooks';

const books = [
  { title: 'Beta', author: 'Jane', genre: 'Fantasy', status: 'Unread', rating: 3 },
  { title: 'Alpha', author: 'Alex', genre: 'Classic', status: 'Finished', rating: 5 },
  { title: 'Gamma', author: 'Bea', genre: 'Fantasy', status: 'Finished', rating: null },
];

describe('filterAndSortBooks', () => {
  it('searches title and author while applying filters', () => {
    const result = filterAndSortBooks(books, {
      query: 'bea',
      status: 'Finished',
      genre: 'Fantasy',
      sortBy: 'title',
      direction: 'asc',
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Gamma');
  });

  it('sorts by rating descending', () => {
    const result = filterAndSortBooks(books, {
      query: '',
      status: 'All',
      genre: 'All',
      sortBy: 'rating',
      direction: 'desc',
    });

    expect(result.map((book) => book.title)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});

describe('paginate', () => {
  it('returns a safe page and page count', () => {
    const result = paginate([1, 2, 3, 4, 5], 99, 2);

    expect(result.page).toBe(3);
    expect(result.pageCount).toBe(3);
    expect(result.items).toEqual([5]);
  });
});
