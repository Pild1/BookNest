# BookNest - SDI Assignment 4 Backend

Backend REST API implementation for Assignment 4 bronze, extending Assignment 3 with HTTPS, authentication, authorization, and token sessions.

## Requirements Covered

- Register/login/logout/me endpoints.
- Password hashing with `scrypt`.
- Opaque bearer tokens stored as SHA-256 hashes in the `Session` table.
- Inactivity-based session expiry.
- USER authorization for protected routes.
- HTTPS server binding on `0.0.0.0`.
- Protected REST API endpoints for Book CRUD.
- Protected statistics endpoint.
- Server-side validation.
- Server-side pagination.
- Prisma ORM + SQLite relational persistence.
- Migration files generated from `prisma/schema.prisma`.
- 3NF explanation in `docs/3nf.md`.
- Automated tests with Node's built-in test runner.

## Run

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run backend
```

The server starts on HTTPS:

```text
https://0.0.0.0:3001
```

From another real or virtual machine on the same LAN, use:

```text
https://SERVER_MACHINE_IP:3001
```

The default certificate is self-signed for lab/demo use. To provide your own certificate:

```powershell
$env:SSL_KEY_PATH="C:\path\to\key.pem"
$env:SSL_CERT_PATH="C:\path\to\cert.pem"
npm.cmd run backend
```

For development-only fallback HTTP:

```powershell
$env:ALLOW_HTTP="true"
npm.cmd run backend
```

## Test

```powershell
npm.cmd run backend:test
```

## Auth Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Protected Endpoints

- `GET /api/books?page=1&pageSize=10`
- `GET /api/books/:id`
- `POST /api/books`
- `PUT /api/books/:id`
- `DELETE /api/books/:id`
- `GET /api/stats`
