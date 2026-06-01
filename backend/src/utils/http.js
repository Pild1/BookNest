export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    ...corsHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
}

export async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody.trim()) return {};

  try {
    return JSON.parse(rawBody);
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

export function getIdFromPath(pathname, basePath) {
  const rest = pathname.slice(basePath.length).replace(/^\/+/, '');
  return rest ? decodeURIComponent(rest.split('/')[0]) : null;
}

export function parsePositiveInteger(value, fallback, options = {}) {
  const number = Number(value);
  const max = options.max ?? Number.MAX_SAFE_INTEGER;

  if (!Number.isInteger(number) || number < 1) return fallback;
  return Math.min(number, max);
}
