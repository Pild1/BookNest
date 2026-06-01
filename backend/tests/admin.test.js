import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/services/passwordService.js';

test('admin routes require ADMIN role and manage user roles', async (t) => {
  const app = createApp();
  const server = createServer(app.handleRequest);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))));

  const adminRegister = await postJson(`${baseUrl}/api/auth/register`, {
    email: `admin-${Date.now()}@example.com`,
    password: 'Secret123',
    displayName: 'Temp Admin',
  });

  await app.prisma.user.update({
    where: { id: adminRegister.user.id },
    data: { role: 'ADMIN' },
  });

  const adminLogin = await loginJson(`${baseUrl}/api/auth/login`, {
    email: adminRegister.user.email,
    password: 'Secret123',
  });

  const userRegister = await postJson(`${baseUrl}/api/auth/register`, {
    email: `member-${Date.now()}@example.com`,
    password: 'Secret123',
    displayName: 'Member',
  });

  const forbidden = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${userRegister.token}` },
  });
  assert.equal(forbidden.status, 403);

  const usersResponse = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${adminLogin.token}` },
  });
  const usersBody = await usersResponse.json();
  assert.equal(usersResponse.status, 200);
  assert.ok(usersBody.data.some((user) => user.id === userRegister.user.id));

  const roleUpdate = await fetch(`${baseUrl}/api/admin/users/${userRegister.user.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminLogin.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'ADMIN' }),
  });
  assert.equal(roleUpdate.status, 200);
  assert.equal((await roleUpdate.json()).data.role, 'ADMIN');

  const stored = await app.prisma.user.findUnique({ where: { id: userRegister.user.id } });
  assert.equal(stored.role, 'ADMIN');
});

test('user admin service prevents removing the last admin', async (t) => {
  const app = createApp();
  const prisma = app.prisma;
  const email = `solo-admin-${Date.now()}@example.com`;

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword('Secret123'),
      displayName: 'Solo Admin',
      role: 'ADMIN',
    },
  });

  t.after(async () => {
    await prisma.session.deleteMany({ where: { userId: admin.id } });
    await prisma.user.delete({ where: { id: admin.id } });
    await prisma.$disconnect();
  });

  await assert.rejects(
    () => app.userAdminService.updateUserRole(admin.id, 'USER', admin.id),
    (error) => error.message.includes('cannot remove your own admin role'),
  );
});

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  return body.data;
}

async function loginJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  return body.data;
}
