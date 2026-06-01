import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { createBookRepository } from '../src/services/bookRepository.js';

test('database repository creates relational records and computes statistics', async (t) => {
  const prisma = new PrismaClient();
  const userId = `test-user-${randomUUID()}`;
  const repository = createBookRepository(prisma, { userId });

  await prisma.loan.deleteMany({ where: { book: { userId } } });
  await prisma.book.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });

  t.after(async () => {
    await prisma.loan.deleteMany({ where: { book: { userId } } });
    await prisma.book.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  const created = await repository.create({
    title: 'Dune',
    author: 'Frank Herbert',
    isbn: '9780441172719',
    genre: 'Science Fiction',
    coverUrl: 'https://example.com/dune.jpg',
    totalPages: 412,
    currentPage: 100,
    status: 'IN_PROGRESS',
    rating: 5,
    notes: 'Persistent test record.',
    isWishlist: false,
    loan: {
      borrowerName: 'Mara',
      borrowerContact: 'mara@example.com',
      loanDate: '2026-06-01',
      returnDate: null,
      isReturned: false,
    },
  });

  assert.equal(created.title, 'Dune');
  assert.equal(created.loan.borrowerName, 'Mara');

  const page = await repository.list({ page: 1, pageSize: 10, genre: 'Science Fiction' });
  assert.equal(page.pagination.totalItems, 1);

  const stats = await repository.stats();
  assert.equal(stats.totalBooks, 1);
  assert.equal(stats.inProgress, 1);
  assert.equal(stats.lentOut, 1);
  assert.equal(stats.averageRating, 5);

  const updated = await repository.update(created.id, {
    ...created,
    title: 'Dune Updated',
    currentPage: 412,
    status: 'FINISHED',
    loan: null,
  });

  assert.equal(updated.title, 'Dune Updated');
  assert.equal(updated.loan, null);
  assert.equal(await repository.remove(created.id), true);
  assert.equal(await repository.findById(created.id), null);
});

test('update returns the book for the authenticated user, not the demo user', async (t) => {
  const prisma = new PrismaClient();
  const userId = `test-user-${randomUUID()}`;
  const repository = createBookRepository(prisma);

  await prisma.user.create({
    data: {
      id: userId,
      email: `${userId}@booknest.test`,
      passwordHash: 'test-hash',
      displayName: 'Update Tester',
      role: 'USER',
    },
  });

  t.after(async () => {
    await prisma.loan.deleteMany({ where: { book: { userId } } });
    await prisma.book.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  const created = await repository.create(
    {
      title: 'Before',
      author: 'Author',
      isbn: '',
      genre: 'Classic',
      coverUrl: '',
      totalPages: 120,
      currentPage: 0,
      status: 'UNREAD',
      rating: null,
      notes: '',
      isWishlist: false,
      loan: null,
    },
    userId,
  );

  const updated = await repository.update(
    created.id,
    {
      title: 'After',
      author: 'Author',
      isbn: '',
      genre: 'Classic',
      coverUrl: '',
      totalPages: 120,
      currentPage: 0,
      status: 'UNREAD',
      rating: null,
      notes: '',
      isWishlist: false,
      loan: null,
    },
    userId,
  );

  assert.equal(updated?.title, 'After');
});
