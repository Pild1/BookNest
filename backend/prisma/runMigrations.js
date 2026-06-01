import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { loadPrismaEnv } from './loadEnv.js';

const prismaDir = fileURLToPath(new URL('.', import.meta.url));
const schemaPath = join(prismaDir, 'schema.prisma');
const databaseUrl = loadPrismaEnv();

if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Configure backend/prisma/.env first.');
  process.exit(1);
}

if (databaseUrl.startsWith('sqlserver:')) {
  process.env.DATABASE_URL = databaseUrl;
  const result = spawnSync(
    'npx',
    ['prisma', 'db', 'push', '--schema', schemaPath, '--accept-data-loss'],
    { stdio: 'inherit', shell: true, env: process.env },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log('BookNest SQL Server schema applied.');
} else {
  applySqliteMigrations(databaseUrl);
  console.log('BookNest SQLite database migrations applied.');
}

function applySqliteMigrations(databaseUrl) {
  const dbPath = databaseUrl.replace(/^file:/, '');
  const resolvedDbPath = dbPath.startsWith('.') ? join(prismaDir, dbPath) : dbPath;
  const migrationsDir = join(prismaDir, 'migrations');
  const database = new DatabaseSync(resolvedDbPath);

  database.exec('PRAGMA foreign_keys = ON;');

  for (const folder of readdirSync(migrationsDir).filter((name) => /^\d+_/.test(name)).sort()) {
    const sql = readFileSync(join(migrationsDir, folder, 'migration.sql'), 'utf8');
    for (const statement of splitSql(sql)) {
      try {
        database.exec(statement);
      } catch (error) {
        if (!isIgnorableMigrationError(error)) throw error;
      }
    }
  }

  database.close();
}

function splitSql(sql) {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`);
}

function isIgnorableMigrationError(error) {
  return /duplicate column name|already exists/i.test(error.message);
}
