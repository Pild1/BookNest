const statusFromApi = {
  UNREAD: 'Unread',
  IN_PROGRESS: 'In Progress',
  FINISHED: 'Finished',
};

const statusToApi = {
  Unread: 'UNREAD',
  'In Progress': 'IN_PROGRESS',
  Finished: 'FINISHED',
};

export function mapBookFromApi(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn ?? '',
    genre: book.genre ?? '',
    coverUrl: book.coverUrl ?? '',
    totalPages: book.totalPages,
    currentPage: book.currentPage,
    status: statusFromApi[book.status] ?? book.status,
    rating: book.rating ?? null,
    notes: book.notes ?? '',
    isWishlist: Boolean(book.isWishlist),
    isDeleted: Boolean(book.isDeleted),
    createdAt: book.createdAt,
    loan: book.loan ?? null,
  };
}

export function mapBookToApi(book) {
  return {
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    genre: book.genre,
    coverUrl: book.coverUrl,
    totalPages: book.totalPages,
    currentPage: book.currentPage,
    status: statusToApi[book.status] ?? String(book.status).replace(/\s+/g, '_').toUpperCase(),
    rating: book.rating === '' || book.rating === null ? null : Number(book.rating),
    notes: book.notes,
    isWishlist: Boolean(book.isWishlist),
    loan: book.loan,
  };
}
