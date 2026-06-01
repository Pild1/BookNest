import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const keyLength = 64;

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(password, salt, keyLength).toString('hex');
  return `scrypt:${salt}:${key}`;
}

export function verifyPassword(password, storedHash) {
  const [algorithm, salt, key] = String(storedHash).split(':');
  if (algorithm !== 'scrypt' || !salt || !key) return false;

  const expected = Buffer.from(key, 'hex');
  const actual = scryptSync(password, salt, keyLength);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
