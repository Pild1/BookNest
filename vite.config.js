import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveApiProxyTarget } from './scripts/resolveApiProxyTarget.mjs';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

function loadDevHttps() {
  const keyPath = join(projectRoot, 'certs', 'localhost-key.pem');
  const certPath = join(projectRoot, 'certs', 'localhost-cert.pem');

  if (!existsSync(keyPath) || !existsSync(certPath)) {
    return undefined;
  }

  return {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath),
  };
}

const https = loadDevHttps();
const apiProxyTarget = resolveApiProxyTarget();

export default defineConfig({
  plugins: [react()],
  server: {
    https,
    host: true,
    port: Number(process.env.VITE_PORT || 5173),
    strictPort: false,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        secure: false,
        changeOrigin: true,
      },
    },
  },
  preview: {
    https,
    host: true,
    port: Number(process.env.VITE_PORT || 5173),
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**'],
    },
  },
});
