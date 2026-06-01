import { PrismaClient } from '@prisma/client';
import { loadPrismaEnv } from '../../prisma/loadEnv.js';

loadPrismaEnv();

export function createPrismaClient(options = {}) {
  return new PrismaClient(options);
}
