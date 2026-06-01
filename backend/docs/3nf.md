# BookNest Database Normalization

The Assignment 3 database is relational and generated through Prisma migrations from the domain model in `prisma/schema.prisma`.

## Relations

| Table | Primary Key | Main Attributes | Foreign Keys |
| --- | --- | --- | --- |
| `User` | `id` | `email`, `passwordHash`, `displayName`, `createdAt` | none |
| `Book` | `id` | `title`, `author`, `isbn`, `genre`, `coverUrl`, `totalPages`, `currentPage`, `status`, `rating`, `notes`, `isWishlist`, `isDeleted`, timestamps | `userId -> User.id` |
| `Loan` | `id` | `borrowerName`, `borrowerContact`, `loanDate`, `returnDate`, `isReturned` | `bookId -> Book.id` |

## 1NF

Every table has a primary key. Each column stores atomic values: one title, one author, one status, one borrower name, and so on. Repeating lending data is not stored inside the `Book` row; it is stored as separate `Loan` rows.

## 2NF

All tables use single-column primary keys, so every non-key attribute depends on the whole primary key. Book attributes depend on `Book.id`; loan attributes depend on `Loan.id`; user attributes depend on `User.id`.

## 3NF

There are no transitive dependencies between non-key attributes:

- User account fields depend only on `User.id`.
- Book metadata and reading progress depend only on `Book.id`.
- Loan data depends only on `Loan.id`, while the relationship to the book is represented by `bookId`.
- User data is not duplicated in `Book`; borrower data is not duplicated in `Book`; book data is not duplicated in `Loan`.

This satisfies 3NF for the Assignment 3 domain model.
