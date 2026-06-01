export const statuses = ['UNREAD', 'IN_PROGRESS', 'FINISHED'];

const urlPattern = /^https?:\/\/.+/i;

export function normalizeBookPayload(payload) {
  const totalPages = Number(payload.totalPages ?? 0);
  const currentPage = Number(payload.currentPage ?? 0);
  const rating = payload.rating === undefined || payload.rating === null || payload.rating === '' ? null : Number(payload.rating);

  return {
    title: String(payload.title ?? '').trim(),
    author: String(payload.author ?? '').trim(),
    isbn: String(payload.isbn ?? '').trim(),
    genre: String(payload.genre ?? '').trim(),
    coverUrl: String(payload.coverUrl ?? '').trim(),
    totalPages,
    currentPage,
    status: String(payload.status ?? 'UNREAD').trim().toUpperCase(),
    rating,
    notes: String(payload.notes ?? '').trim(),
    isWishlist: Boolean(payload.isWishlist ?? false),
    loan: normalizeLoan(payload.loan),
  };
}

export function validateBookPayload(payload) {
  const book = normalizeBookPayload(payload);
  const errors = {};

  if (!book.title) errors.title = 'Title is required.';
  if (!book.author) errors.author = 'Author is required.';
  if (!statuses.includes(book.status)) errors.status = 'Status must be UNREAD, IN_PROGRESS, or FINISHED.';
  if (book.coverUrl && !urlPattern.test(book.coverUrl)) errors.coverUrl = 'Cover URL must start with http:// or https://.';
  if (!Number.isInteger(book.totalPages) || book.totalPages < 1) errors.totalPages = 'Total pages must be an integer greater than 0.';
  if (!Number.isInteger(book.currentPage) || book.currentPage < 0) errors.currentPage = 'Current page must be a non-negative integer.';
  if (book.currentPage > book.totalPages) errors.currentPage = 'Current page cannot exceed total pages.';
  if (book.rating !== null && (!Number.isInteger(book.rating) || book.rating < 1 || book.rating > 5)) {
    errors.rating = 'Rating must be an integer from 1 to 5.';
  }
  if (book.status === 'UNREAD' && book.currentPage !== 0) {
    errors.currentPage = 'Unread books must have currentPage set to 0.';
  }
  if (book.status === 'FINISHED' && book.currentPage !== book.totalPages) {
    errors.currentPage = 'Finished books must have currentPage equal to totalPages.';
  }

  if (book.loan && !book.loan.borrowerName) {
    errors.loan = 'Loan borrowerName is required when loan is provided.';
  }

  return {
    book,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function normalizeLoan(loan) {
  if (!loan) return null;

  return {
    borrowerName: String(loan.borrowerName ?? '').trim(),
    borrowerContact: String(loan.borrowerContact ?? '').trim(),
    loanDate: String(loan.loanDate ?? '').trim(),
    returnDate: loan.returnDate ? String(loan.returnDate).trim() : null,
    isReturned: Boolean(loan.isReturned ?? false),
  };
}
