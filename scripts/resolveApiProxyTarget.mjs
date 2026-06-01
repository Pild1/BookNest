import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPrimaryLanAddress } from './networkAddresses.mjs';

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export function resolveApiProxyTarget() {
  if (process.env.VITE_API_PROXY_TARGET) {
    return process.env.VITE_API_PROXY_TARGET;
  }

  if (process.env.BOOKNEST_API_PROXY_TARGET) {
    return process.env.BOOKNEST_API_PROXY_TARGET;
  }

  const host = process.env.BOOKNEST_API_HOST || readMetaHost() || '127.0.0.1';
  const port = process.env.BOOKNEST_API_PORT || process.env.PORT || '3001';
  return `https://${host}:${port}`;
}

function readMetaHost() {
  if (process.env.BOOKNEST_USE_LAN_PROXY === 'true') {
    return getPrimaryLanAddress();
  }

  return null;
}

export function readNetworkMeta() {
  const metaPath = join(projectRoot, 'certs', 'network-meta.json');
  if (!existsSync(metaPath)) return null;

  try {
    return JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    return null;
  }
}
