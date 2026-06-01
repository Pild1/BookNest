import { statuses } from '../data/books';

const urlPattern = /^https?:\/\/.+/i;

export function normalizeBook(rawBook) {
  const totalPages = Number(rawBook.totalPages || 0);
  const currentPage = Number(rawBook.currentPage || 0);
  const rating = rawBook.rating === '' || rawBook.rating === null ? null : Number(rawBook.rating);

  return {
    ...rawBook,
    title: rawBook.title.trim(),
    author: rawBook.author.trim(),
    isbn: rawBook.isbn.trim(),
    genre: rawBook.genre.trim(),
    coverUrl: rawBook.coverUrl.trim(),
    totalPages,
    currentPage,
    rating,
    notes: rawBook.notes.trim(),
  };
}

export function validateBook(rawBook) {
  const book = normalizeBook(rawBook);
  const errors = {};

  if (!book.title) errors.title = 'Title is required.';
  if (!book.author) errors.author = 'Author is required.';
  if (!statuses.includes(book.status)) errors.status = 'Choose a valid reading status.';
  if (book.coverUrl && !urlPattern.test(book.coverUrl)) errors.coverUrl = 'Cover must be a valid http(s) URL.';
  if (!Number.isInteger(book.totalPages) || book.totalPages < 1) errors.totalPages = 'Total pages must be at least 1.';
  if (!Number.isInteger(book.currentPage) || book.currentPage < 0) errors.currentPage = 'Current page cannot be negative.';
  if (book.currentPage > book.totalPages) errors.currentPage = 'Current page cannot exceed total pages.';
  if (book.rating !== null && (!Number.isInteger(book.rating) || book.rating < 1 || book.rating > 5)) {
    errors.rating = 'Rating must be between 1 and 5.';
  }
  if (book.status === 'Unread' && book.currentPage !== 0) {
    errors.currentPage = 'Unread books must start at page 0.';
  }
  if (book.status === 'Finished' && book.currentPage !== book.totalPages) {
    errors.currentPage = 'Finished books must have all pages read.';
  }

  return { book, errors, isValid: Object.keys(errors).length === 0 };
}

export function progressPercent(book) {
  if (!book.totalPages) return 0;
  return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
}
