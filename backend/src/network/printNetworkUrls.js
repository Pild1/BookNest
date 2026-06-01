import { networkInterfaces } from 'node:os';

export function printNetworkUrls({ apiPort, webPort, protocol = 'https' }) {
  const lanAddresses = getLanIPv4Addresses();

  console.log('\nLAN access:');
  if (lanAddresses.length === 0) {
    console.log(`  ${protocol}://localhost:${apiPort}/api/health`);
    console.log('  (No LAN IPv4 detected — set BOOKNEST_LAN_IP and run npm run certs -- --force)\n');
    return;
  }

  for (const ip of lanAddresses) {
    console.log(`  API       ${protocol}://${ip}:${apiPort}/api/health`);
    console.log(`  Frontend  ${protocol}://${ip}:${webPort}`);
  }
  console.log('\n  Other devices: use the Frontend URL above (same Wi‑Fi / LAN).');
  console.log('  Allow Windows Firewall for ports', apiPort, 'and', webPort, 'if blocked.\n');
}

function getLanIPv4Addresses() {
  const addresses = new Set();

  for (const interfaces of Object.values(networkInterfaces())) {
    if (!interfaces) continue;
    for (const entry of interfaces) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      if (entry.address.startsWith('169.254.')) continue;
      addresses.add(entry.address);
    }
  }

  const extra = String(process.env.BOOKNEST_LAN_IPS || process.env.BOOKNEST_LAN_IP || '')
    .split(/[,\s;]+/)
    .map((value) => value.trim())
    .filter((value) => /^\d{1,3}(\.\d{1,3}){3}$/.test(value));

  for (const ip of extra) addresses.add(ip);

  return [...addresses];
}
