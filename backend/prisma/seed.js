import { PrismaClient } from '@prisma/client';
import { seedBooks } from '../src/data/seedBooks.js';
import { hashPassword } from '../src/services/passwordService.js';
import { loadPrismaEnv } from './loadEnv.js';

loadPrismaEnv();
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: 'user-admin' },
    update: { role: 'ADMIN', displayName: 'BookNest Admin' },
    create: {
      id: 'user-admin',
      email: 'admin@booknest.local',
      passwordHash: hashPassword('Admin123!'),
      displayName: 'BookNest Admin',
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.upsert({
    where: { id: 'user-demo' },
    update: {},
    create: {
      id: 'user-demo',
      email: 'reader@booknest.local',
      passwordHash: 'assignment-demo-hash',
      displayName: 'BookNest Reader',
      role: 'USER',
    },
  });

  for (const seedBook of seedBooks) {
    const book = await prisma.book.upsert({
      where: { id: seedBook.id },
      update: {},
      create: {
        id: seedBook.id,
        userId: user.id,
        title: seedBook.title,
        author: seedBook.author,
        isbn: seedBook.isbn || null,
        genre: seedBook.genre || null,
        coverUrl: seedBook.coverUrl || null,
        totalPages: seedBook.totalPages,
        currentPage: seedBook.currentPage,
        status: seedBook.status,
        rating: seedBook.rating,
        notes: seedBook.notes || null,
        isWishlist: seedBook.isWishlist,
        isDeleted: seedBook.isDeleted,
        createdAt: new Date(seedBook.createdAt),
      },
    });

    if (seedBook.loan && !seedBook.loan.isReturned) {
      const existingLoan = await prisma.loan.findFirst({
        where: { bookId: book.id, borrowerName: seedBook.loan.borrowerName, isReturned: false },
      });

      if (!existingLoan) {
        await prisma.loan.create({
          data: {
            bookId: book.id,
            borrowerName: seedBook.loan.borrowerName,
            borrowerContact: seedBook.loan.borrowerContact || null,
            loanDate: new Date(seedBook.loan.loanDate),
            returnDate: seedBook.loan.returnDate ? new Date(seedBook.loan.returnDate) : null,
            isReturned: seedBook.loan.isReturned,
          },
        });
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('BookNest database seeded.');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
