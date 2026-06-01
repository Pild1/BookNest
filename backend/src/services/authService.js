import { createHash, randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from './passwordService.js';

const sessionMinutes = Number(process.env.SESSION_IDLE_MINUTES || 30);

export function createAuthService(prisma) {
  async function register({ email, password, displayName }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const error = new Error('Email is already registered.');
      error.statusCode = 409;
      throw error;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        displayName,
        role: 'USER',
      },
    });

    return createSession(user);
  }

  async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    return createSession(user);
  }

  async function authenticate(token) {
    if (!token) return null;

    const now = new Date();
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= now) {
      return null;
    }

    const expiresAt = nextExpiry();
    const role = session.user.role;

    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: now, expiresAt, role },
    });

    return {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      role,
      sessionId: session.id,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async function logout(token) {
    if (!token) return;
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async function createSession(user) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = nextExpiry();
    await prisma.session.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        role: user.role,
        expiresAt,
      },
    });

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  return { register, login, authenticate, logout };
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function nextExpiry() {
  return new Date(Date.now() + sessionMinutes * 60 * 1000);
}
