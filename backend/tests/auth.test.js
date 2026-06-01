import assert from 'node:assert/strict';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { createAuthService } from '../src/services/authService.js';
import { verifyPassword } from '../src/services/passwordService.js';
import { validateLoginPayload, validateRegisterPayload } from '../src/validation/authValidation.js';

test('auth validation rejects weak registration data', () => {
  const result = validateRegisterPayload({ email: 'bad', password: 'short', displayName: '' });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.email, 'A valid email address is required.');
  assert.equal(result.errors.displayName, 'Display name is required.');
});

test('auth validation accepts login credentials', () => {
  const result = validateLoginPayload({ email: 'reader@example.com', password: 'Secret123' });

  assert.equal(result.isValid, true);
  assert.equal(result.credentials.email, 'reader@example.com');
});

test('auth service registers, logs in, authenticates, refreshes activity, and logs out', async (t) => {
  const prisma = new PrismaClient();
  const auth = createAuthService(prisma);
  const email = `reader-${Date.now()}@example.com`;

  t.after(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.book.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  const registered = await auth.register({ email, password: 'Secret123', displayName: 'Reader' });
  assert.equal(registered.user.role, 'USER');
  assert.ok(registered.token);

  const storedUser = await prisma.user.findUnique({ where: { email } });
  assert.equal(verifyPassword('Secret123', storedUser.passwordHash), true);

  const loggedIn = await auth.login({ email, password: 'Secret123' });
  const currentUser = await auth.authenticate(loggedIn.token);
  assert.equal(currentUser.email, email);

  await auth.logout(loggedIn.token);
  assert.equal(await auth.authenticate(loggedIn.token), null);
});
