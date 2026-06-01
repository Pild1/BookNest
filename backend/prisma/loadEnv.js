import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const prismaDir = fileURLToPath(new URL('.', import.meta.url));

export function loadPrismaEnv() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  for (const envPath of [join(prismaDir, '.env')]) {
    const databaseUrl = readDatabaseUrl(envPath);
    if (databaseUrl) {
      process.env.DATABASE_URL = databaseUrl;
      return databaseUrl;
    }
  }

  return null;
}

function readDatabaseUrl(envPath) {
  try {
    const match = readFileSync(envPath, 'utf8').match(/^\s*DATABASE_URL\s*=\s*"([^"]+)"/m);
    return match?.[1]?.replace(/\\\\/g, '\\') ?? null;
  } catch {
    return null;
  }
}
