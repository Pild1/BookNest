import { createBooksRouter } from './routes/booksRoutes.js';
import { createStatsRouter } from './routes/statsRoutes.js';
import { createAuthRouter } from './routes/authRoutes.js';
import { createAdminRouter } from './routes/adminRoutes.js';
import { corsHeaders, sendJson } from './utils/http.js';
import { createPrismaClient } from './db/prismaClient.js';
import { createBookRepository } from './services/bookRepository.js';
import { createAuthService } from './services/authService.js';
import { createUserAdminService } from './services/userAdminService.js';
import { requireAuth } from './middleware/requireAuth.js';
import { requireAdmin } from './middleware/requireAdmin.js';

export function createApp(options = {}) {
  const prisma = options.prisma ?? createPrismaClient();
  const repository = options.repository ?? createBookRepository(prisma, options);
  const authService = options.authService ?? createAuthService(prisma);
  const userAdminService = options.userAdminService ?? createUserAdminService(prisma);
  const authRouter = createAuthRouter(authService);
  const adminRouter = createAdminRouter(userAdminService);
  const booksRouter = createBooksRouter(repository);
  const statsRouter = createStatsRouter(repository);

  async function handleRequest(request, response) {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

      if (request.method === 'OPTIONS') {
        response.writeHead(204, corsHeaders());
        response.end();
        return;
      }

      if (url.pathname === '/' && request.method === 'GET') {
        sendJson(response, 200, {
          service: 'BookNest API',
          message: 'This is the REST API only. Open the React app for login and register UI.',
          frontend: 'https://localhost:5173',
          endpoints: {
            health: 'GET /api/health',
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            books: 'GET /api/books (Authorization: Bearer TOKEN)',
          },
        });
        return;
      }

      if (url.pathname === '/api/health' && request.method === 'GET') {
        sendJson(response, 200, { status: 'ok', service: 'BookNest API', transport: 'https-ready' });
        return;
      }

      if (url.pathname.startsWith('/api/auth')) {
        await authRouter(request, response, url);
        return;
      }

      if (url.pathname.startsWith('/api/admin')) {
        const admin = await requireAdmin(request, response, authService);
        if (!admin) return;
        await adminRouter(request, response, url, admin);
        return;
      }

      if (url.pathname.startsWith('/api/books')) {
        const user = await requireAuth(request, response, authService);
        if (!user) return;
        await booksRouter(request, response, url, user);
        return;
      }

      if (url.pathname === '/api/stats') {
        const user = await requireAuth(request, response, authService);
        if (!user) return;
        await statsRouter(request, response, url, user);
        return;
      }

      sendJson(response, 404, { error: 'Endpoint not found.' });
    } catch (error) {
      sendJson(response, 500, { error: 'Unexpected server error.', details: error.message });
    }
  }

  return { handleRequest, repository, authService, userAdminService, prisma };
}
