const allowedRoles = new Set(['USER', 'ADMIN']);

export function createUserAdminService(prisma) {
  async function listUsers() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { sessions: true, books: true } },
        sessions: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true, lastActivityAt: true, expiresAt: true, role: true },
          orderBy: { lastActivityAt: 'desc' },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      bookCount: user._count.books,
      activeSessions: user.sessions.map((session) => ({
        id: session.id,
        role: session.role,
        lastActivityAt: session.lastActivityAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      })),
    }));
  }

  async function updateUserRole(userId, role, actingAdminId) {
    const normalizedRole = String(role).trim().toUpperCase();
    if (!allowedRoles.has(normalizedRole)) {
      const error = new Error('Role must be USER or ADMIN.');
      error.statusCode = 400;
      throw error;
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    if (target.id === actingAdminId && normalizedRole !== 'ADMIN') {
      const error = new Error('You cannot remove your own admin role.');
      error.statusCode = 400;
      throw error;
    }

    if (target.role === 'ADMIN' && normalizedRole === 'USER') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        const error = new Error('At least one admin account must remain.');
        error.statusCode = 400;
        throw error;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: normalizedRole },
    });

    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { role: normalizedRole },
    });

    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async function revokeUserSessions(userId) {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const result = await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { userId, revokedCount: result.count };
  }

  return { listUsers, updateUserRole, revokeUserSessions };
}
