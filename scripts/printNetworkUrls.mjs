import { getLanIPv4Addresses, getPrimaryLanAddress } from './networkAddresses.mjs';

const lanAddresses = getLanIPv4Addresses();
const primary = getPrimaryLanAddress();
const apiPort = process.env.PORT || '3001';
const webPort = process.env.VITE_PORT || '5173';

console.log('\nBookNest network URLs (HTTPS, self-signed certificate):\n');

if (lanAddresses.length === 0) {
  console.log('  No LAN IPv4 found on this machine.');
  console.log('  Local only:');
  console.log(`    Frontend  https://localhost:${webPort}`);
  console.log(`    API       https://localhost:${apiPort}`);
  console.log('\n  Set BOOKNEST_LAN_IP=your.ip.address then: npm run certs -- --force\n');
} else {
  for (const ip of lanAddresses) {
    console.log(`  Frontend  https://${ip}:${webPort}`);
    console.log(`  API       https://${ip}:${apiPort}/api/health`);
    console.log('');
  }
  console.log('  Other devices: open the Frontend URL and accept the certificate warning.');
  console.log(`  Or on a client PC: $env:VITE_API_URL="https://${primary}:${apiPort}"; npm run dev`);
  console.log('\n  Allow Windows Firewall inbound for ports', apiPort, 'and', webPort, 'if prompted.\n');
}
