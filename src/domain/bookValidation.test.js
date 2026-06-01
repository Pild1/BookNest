import { describe, expect, it } from 'vitest';
import { progressPercent, validateBook } from './bookValidation';

const validBook = {
  title: 'Dune',
  author: 'Frank Herbert',
  isbn: '9780441172719',
  genre: 'Science Fiction',
  coverUrl: 'https://example.com/dune.jpg',
  totalPages: '412',
  currentPage: '100',
  status: 'In Progress',
  rating: '5',
  notes: 'Desert politics.',
};

describe('validateBook', () => {
  it('normalizes and accepts a valid book', () => {
    const result = validateBook(validBook);

    expect(result.isValid).toBe(true);
    expect(result.book.totalPages).toBe(412);
    expect(result.book.rating).toBe(5);
  });

  it('rejects missing required fields and impossible progress', () => {
    const result = validateBook({
      ...validBook,
      title: '',
      author: '',
      currentPage: '500',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBe('Title is required.');
    expect(result.errors.author).toBe('Author is required.');
    expect(result.errors.currentPage).toBe('Current page cannot exceed total pages.');
  });

  it('keeps status and progress consistent', () => {
    expect(validateBook({ ...validBook, status: 'Unread', currentPage: '5' }).errors.currentPage).toBe(
      'Unread books must start at page 0.',
    );
    expect(validateBook({ ...validBook, status: 'Finished', currentPage: '411' }).errors.currentPage).toBe(
      'Finished books must have all pages read.',
    );
  });
});

describe('progressPercent', () => {
  it('calculates bounded reading progress', () => {
    expect(progressPercent({ totalPages: 200, currentPage: 50 })).toBe(25);
    expect(progressPercent({ totalPages: 100, currentPage: 120 })).toBe(100);
  });
});
