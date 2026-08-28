function env(name: string) {
  return process.env[name]?.trim() || '';
}

function configuredOrigins() {
  return env('MOBILE_ALLOWED_ORIGINS')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function allowedOriginsFor(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  return new Set([
    'https://localhost',
    requestOrigin,
    ...configuredOrigins(),
  ]);
}

export function mobileCorsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  const allowed = allowedOriginsFor(request);

  return {
    ...(origin && allowed.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function assertMobileOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  if (!allowedOriginsFor(request).has(origin)) {
    throw new Response('Origin não autorizado.', { status: 403 });
  }
}

export function mobilePreflight(request: Request) {
  assertMobileOrigin(request);
  return new Response(null, {
    status: 204,
    headers: mobileCorsHeaders(request),
  });
}

export function mobileJson(request: Request, data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  for (const [key, value] of Object.entries(mobileCorsHeaders(request))) {
    headers.set(key, value);
  }
  return Response.json(data, { ...init, headers });
}

export function bearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() || '';
  if (!token) throw new Response('Autenticação obrigatória.', { status: 401 });
  return token;
}
