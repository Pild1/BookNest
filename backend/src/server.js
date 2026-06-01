import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { createApp } from './app.js';
import { getHttpsOptions } from './ssl/devCertificates.js';
import { printNetworkUrls } from './network/printNetworkUrls.js';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';
const app = createApp();
const useHttp = process.env.ALLOW_HTTP === 'true';

const server = useHttp
  ? createHttpServer(app.handleRequest)
  : createHttpsServer(getHttpsOptions(), app.handleRequest);

server.listen(port, host, () => {
  const protocol = useHttp ? 'http' : 'https';
  console.log(`BookNest API running at ${protocol}://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
  if (!useHttp) {
    console.log('Accept the browser certificate warning once for this origin (self-signed dev cert).');
    printNetworkUrls({ apiPort: port, webPort: process.env.VITE_PORT || 5173, protocol });
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Set PORT=3002 or stop the existing server.`);
    process.exit(1);
  }
  throw error;
});
