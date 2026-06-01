import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import selfsigned from 'selfsigned';
import { getCertificateAltNames, getLanIPv4Addresses } from './networkAddresses.mjs';

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const certDir = join(projectRoot, 'certs');
const keyPath = join(certDir, 'localhost-key.pem');
const certPath = join(certDir, 'localhost-cert.pem');
const metaPath = join(certDir, 'network-meta.json');
const force = process.argv.includes('--force');

const altNames = getCertificateAltNames();
const meta = {
  altNames: altNames.map((entry) => (entry.type === 7 ? entry.ip : entry.value)),
  lanAddresses: getLanIPv4Addresses(),
  updatedAt: new Date().toISOString(),
};
const metaHash = createHash('sha256').update(JSON.stringify(meta.altNames)).digest('hex');

if (!force && existsSync(keyPath) && existsSync(certPath) && existsSync(metaPath)) {
  try {
    const previous = JSON.parse(readFileSync(metaPath, 'utf8'));
    if (previous.altNamesHash === metaHash) {
      process.exit(0);
    }
  } catch {
    // Regenerate below.
  }
}

mkdirSync(certDir, { recursive: true });

const certificate = selfsigned.generate([{ name: 'commonName', value: 'BookNest Network Dev' }], {
  days: 365,
  keySize: 2048,
  algorithm: 'sha256',
  extensions: [{ name: 'subjectAltName', altNames }],
});

writeFileSync(keyPath, certificate.private, 'utf8');
writeFileSync(certPath, certificate.cert, 'utf8');
writeFileSync(
  metaPath,
  JSON.stringify({ ...meta, altNamesHash: metaHash }, null, 2),
  'utf8',
);

console.log(`Dev HTTPS certificates written to ${certDir}`);
console.log(`Included addresses: ${meta.altNames.join(', ')}`);
if (meta.lanAddresses.length === 0) {
  console.warn('No LAN IPv4 address detected. Set BOOKNEST_LAN_IP=192.168.x.x and run: npm run certs -- --force');
}
