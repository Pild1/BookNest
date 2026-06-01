import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import selfsigned from 'selfsigned';

const projectRoot = join(fileURLToPath(new URL('../../../', import.meta.url)));
const certDir = join(projectRoot, 'certs');
const defaultKeyPath = join(certDir, 'localhost-key.pem');
const defaultCertPath = join(certDir, 'localhost-cert.pem');

export function getHttpsOptions() {
  const keyPath = process.env.SSL_KEY_PATH || defaultKeyPath;
  const certPath = process.env.SSL_CERT_PATH || defaultCertPath;

  if (existsSync(keyPath) && existsSync(certPath)) {
    return {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    };
  }

  const certificate = selfsigned.generate(
    [{ name: 'commonName', value: 'BookNest Local HTTPS' }],
    {
      days: 30,
      keySize: 2048,
      algorithm: 'sha256',
      extensions: [{ name: 'subjectAltName', altNames: readAltNamesFromMeta() }],
    },
  );

  console.warn('Using an in-memory self-signed HTTPS certificate. Run "npm run certs" to create shared certs in certs/.');
  return { key: certificate.private, cert: certificate.cert };
}

function readAltNamesFromMeta() {
  const metaPath = join(certDir, 'network-meta.json');
  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      const names = (meta.altNames || []).map((value) =>
        /^\d{1,3}(\.\d{1,3}){3}$/.test(value) ? { type: 7, ip: value } : { type: 2, value },
      );
      if (names.length > 0) return names;
    } catch {
      // Fall through.
    }
  }

  return [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
  ];
}
