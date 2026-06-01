const defaultUser = {
  id: 'user-demo',
  email: 'reader@booknest.local',
  passwordHash: 'assignment-demo-hash',
  displayName: 'BookNest Reader',
};

export function createBookRepository(prisma, config = {}) {
  async function ensureUser(userId = config.userId ?? defaultUser.id) {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        ...defaultUser,
        id: userId,
        email: userId === defaultUser.id ? defaultUser.email : `${userId}@booknest.local`,
      },
    });
  }

  async function list(options = {}) {
    const userId = options.userId ?? config.userId ?? defaultUser.id;
    await ensureUser(userId);

    const page = parseBoundedInteger(options.page, 1);
    const pageSize = parseBoundedInteger(options.pageSize, 10, 100);
    const where = buildWhere(options, userId);
    const orderBy = buildOrderBy(options);
    const totalItems = await prisma.book.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(page, totalPages);

    const books = await prisma.book.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: activeLoanInclude,
    });

    return {
      data: books.map(toApiBook),
      pagination: {
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  async function findById(id, userId = config.userId ?? defaultUser.id) {
    await ensureUser(userId);
    const book = await prisma.book.findFirst({
      where: { id, userId, isDeleted: false },
      include: activeLoanInclude,
    });

    return book ? toApiBook(book) : null;
  }

  async function create(bookPayload, userId = config.userId ?? defaultUser.id) {
    await ensureUser(userId);

    const book = await prisma.book.create({
      data: {
        userId,
        title: bookPayload.title,
        author: bookPayload.author,
        isbn: emptyToNull(bookPayload.isbn),
        genre: emptyToNull(bookPayload.genre),
        coverUrl: emptyToNull(bookPayload.coverUrl),
        totalPages: bookPayload.totalPages,
        currentPage: bookPayload.currentPage,
        status: bookPayload.status,
        rating: bookPayload.rating,
        notes: emptyToNull(bookPayload.notes),
        isWishlist: bookPayload.isWishlist,
        loans: bookPayload.loan ? { create: toLoanCreate(bookPayload.loan) } : undefined,
      },
      include: activeLoanInclude,
    });

    return toApiBook(book);
  }

  async function update(id, bookPayload, userId = config.userId ?? defaultUser.id) {
    await ensureUser(userId);

    const existing = await prisma.book.findFirst({ where: { id, userId, isDeleted: false } });
    if (!existing) return null;

    await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id },
        data: {
          title: bookPayload.title,
          author: bookPayload.author,
          isbn: emptyToNull(bookPayload.isbn),
          genre: emptyToNull(bookPayload.genre),
          coverUrl: emptyToNull(bookPayload.coverUrl),
          totalPages: bookPayload.totalPages,
          currentPage: bookPayload.currentPage,
          status: bookPayload.status,
          rating: bookPayload.rating,
          notes: emptyToNull(bookPayload.notes),
          isWishlist: bookPayload.isWishlist,
        },
      });

      await tx.loan.updateMany({
        where: { bookId: id, isReturned: false },
        data: { isReturned: true, returnDate: new Date() },
      });

      if (bookPayload.loan) {
        await tx.loan.create({
          data: { ...toLoanCreate(bookPayload.loan), bookId: id },
        });
      }
    });

    return findById(id, userId);
  }

  async function remove(id, userId = config.userId ?? defaultUser.id) {
    await ensureUser(userId);
    const existing = await prisma.book.findFirst({ where: { id, userId, isDeleted: false } });
    if (!existing) return false;

    await prisma.book.update({
      where: { id },
      data: { isDeleted: true },
    });
    return true;
  }

  async function stats(userId = config.userId ?? defaultUser.id) {
    await ensureUser(userId);
    const where = { userId, isDeleted: false, isWishlist: false };
    const [totalBooks, unread, inProgress, finished, lentOut, ratingAverage, groupedGenres] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.count({ where: { ...where, status: 'UNREAD' } }),
      prisma.book.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.book.count({ where: { ...where, status: 'FINISHED' } }),
      prisma.loan.count({
        where: {
          isReturned: false,
          book: where,
        },
      }),
      prisma.book.aggregate({
        where: { ...where, rating: { not: null } },
        _avg: { rating: true },
      }),
      prisma.book.groupBy({
        by: ['genre'],
        where,
        _count: { genre: true },
      }),
    ]);

    return {
      totalBooks,
      unread,
      inProgress,
      finished,
      lentOut,
      averageRating: ratingAverage._avg.rating ? Number(ratingAverage._avg.rating.toFixed(2)) : null,
      genres: Object.fromEntries(groupedGenres.map((row) => [row.genre || 'Uncategorized', row._count.genre])),
    };
  }

  return { list, findById, create, update, remove, stats, ensureUser };
}

const activeLoanInclude = {
  loans: {
    where: { isReturned: false },
    orderBy: { loanDate: 'desc' },
    take: 1,
  },
};

const sortableFields = new Set(['title', 'author', 'genre', 'status', 'rating', 'createdAt']);

function buildWhere(options, userId) {
  const search = String(options.search ?? '').trim();
  const status = String(options.status ?? 'ALL').toUpperCase();
  const genre = String(options.genre ?? 'ALL').trim();

  return {
    userId,
    isDeleted: false,
    isWishlist: false,
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { author: { contains: search } },
          ],
        }
      : {}),
    ...(status !== 'ALL' ? { status } : {}),
    ...(genre && genre.toUpperCase() !== 'ALL' ? { genre } : {}),
  };
}

function buildOrderBy(options) {
  const sortBy = sortableFields.has(options.sortBy) ? options.sortBy : 'title';
  const direction = options.direction === 'desc' ? 'desc' : 'asc';
  return { [sortBy]: direction };
}

function parseBoundedInteger(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return Math.min(number, max);
}

function toApiBook(book) {
  const activeLoan = book.loans?.[0] ?? null;

  return {
    id: book.id,
    userId: book.userId,
    title: book.title,
    author: book.author,
    isbn: book.isbn ?? '',
    genre: book.genre ?? '',
    coverUrl: book.coverUrl ?? '',
    totalPages: book.totalPages,
    currentPage: book.currentPage,
    status: book.status,
    rating: book.rating,
    notes: book.notes ?? '',
    isWishlist: book.isWishlist,
    isDeleted: book.isDeleted,
    createdAt: book.createdAt.toISOString(),
    loan: activeLoan ? toApiLoan(activeLoan) : null,
  };
}

function toApiLoan(loan) {
  return {
    id: loan.id,
    bookId: loan.bookId,
    borrowerName: loan.borrowerName,
    borrowerContact: loan.borrowerContact ?? '',
    loanDate: dateOnly(loan.loanDate),
    returnDate: loan.returnDate ? dateOnly(loan.returnDate) : null,
    isReturned: loan.isReturned,
  };
}

function toLoanCreate(loan) {
  return {
    borrowerName: loan.borrowerName,
    borrowerContact: emptyToNull(loan.borrowerContact),
    loanDate: loan.loanDate ? new Date(loan.loanDate) : new Date(),
    returnDate: loan.returnDate ? new Date(loan.returnDate) : null,
    isReturned: Boolean(loan.isReturned),
  };
}

function emptyToNull(value) {
  return value ? value : null;
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}
