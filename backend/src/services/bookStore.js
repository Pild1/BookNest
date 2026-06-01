export function createBookStore(seedBooks = []) {
  let books = seedBooks.map(cloneBook);

  function list(options = {}) {
    const filtered = filterAndSort(visibleBooks(), options);
    const page = parseBoundedInteger(options.page, 1);
    const pageSize = parseBoundedInteger(options.pageSize, 10, 100);
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize).map(cloneBook),
      pagination: {
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  function findById(id) {
    const book = books.find((candidate) => candidate.id === id && !candidate.isDeleted);
    return book ? cloneBook(book) : null;
  }

  function create(bookPayload) {
    const book = {
      ...bookPayload,
      id: `book-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };
    books.unshift(book);
    return cloneBook(book);
  }

  function update(id, bookPayload) {
    const index = books.findIndex((book) => book.id === id && !book.isDeleted);
    if (index === -1) return null;

    books[index] = {
      ...books[index],
      ...bookPayload,
      id,
      isDeleted: false,
    };
    return cloneBook(books[index]);
  }

  function remove(id) {
    const index = books.findIndex((book) => book.id === id && !book.isDeleted);
    if (index === -1) return false;

    books[index] = {
      ...books[index],
      isDeleted: true,
    };
    return true;
  }

  function stats() {
    const active = visibleBooks();

    return {
      totalBooks: active.length,
      unread: active.filter((book) => book.status === 'UNREAD').length,
      inProgress: active.filter((book) => book.status === 'IN_PROGRESS').length,
      finished: active.filter((book) => book.status === 'FINISHED').length,
      lentOut: active.filter((book) => book.loan && !book.loan.isReturned).length,
      averageRating: averageRating(active),
      genres: countBy(active, 'genre'),
    };
  }

  function reset(nextBooks = seedBooks) {
    books = nextBooks.map(cloneBook);
  }

  function visibleBooks() {
    return books.filter((book) => !book.isDeleted && !book.isWishlist);
  }

  return { list, findById, create, update, remove, stats, reset };
}

function filterAndSort(books, options) {
  const search = String(options.search ?? '').trim().toLowerCase();
  const status = String(options.status ?? 'ALL').toUpperCase();
  const genre = String(options.genre ?? 'ALL').trim().toLowerCase();
  const sortBy = allowedSortFields.has(options.sortBy) ? options.sortBy : 'title';
  const direction = options.direction === 'desc' ? -1 : 1;

  return [...books]
    .filter((book) => {
      const matchesSearch =
        !search ||
        book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search);
      const matchesStatus = status === 'ALL' || book.status === status;
      const matchesGenre = genre === 'all' || !genre || book.genre.toLowerCase() === genre;

      return matchesSearch && matchesStatus && matchesGenre;
    })
    .sort((a, b) => {
      const first = a[sortBy] ?? '';
      const second = b[sortBy] ?? '';

      if (typeof first === 'number' || typeof second === 'number') {
        return ((first || 0) - (second || 0)) * direction;
      }

      return String(first).localeCompare(String(second)) * direction;
    });
}

const allowedSortFields = new Set(['title', 'author', 'genre', 'status', 'rating', 'createdAt']);

function parseBoundedInteger(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return Math.min(number, max);
}

function averageRating(books) {
  const ratings = books.map((book) => book.rating).filter((rating) => Number.isInteger(rating));
  if (ratings.length === 0) return null;

  return Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2));
}

function countBy(books, field) {
  return books.reduce((counts, book) => {
    const key = book[field] || 'Uncategorized';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function cloneBook(book) {
  return structuredClone(book);
}
