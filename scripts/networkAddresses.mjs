import { networkInterfaces } from 'node:os';

/** @returns {string[]} Unique IPv4 addresses suitable for LAN HTTPS (not loopback). */
export function getLanIPv4Addresses() {
  const addresses = new Set();

  for (const interfaces of Object.values(networkInterfaces())) {
    if (!interfaces) continue;

    for (const entry of interfaces) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      if (entry.address.startsWith('169.254.')) continue;
      addresses.add(entry.address);
    }
  }

  return [...addresses];
}

export function getExtraAddressesFromEnv() {
  const raw = process.env.BOOKNEST_LAN_IPS || process.env.BOOKNEST_LAN_IP || '';
  return raw
    .split(/[,\s;]+/)
    .map((value) => value.trim())
    .filter((value) => /^\d{1,3}(\.\d{1,3}){3}$/.test(value));
}

export function getCertificateAltNames() {
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
  ];

  for (const ip of [...getLanIPv4Addresses(), ...getExtraAddressesFromEnv()]) {
    altNames.push({ type: 7, ip });
  }

  return altNames;
}

export function getPrimaryLanAddress() {
  const lan = getLanIPv4Addresses();
  return lan[0] || '127.0.0.1';
}
