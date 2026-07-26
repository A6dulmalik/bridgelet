import { NextRequest, NextResponse } from 'next/server';

// This route proxies to an upstream SDK and touches account data, so:
// - never cache responses
// - never run at the edge with implicit static optimization
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const SDK_URL = process.env.BRIDGELET_SDK_URL;
const SDK_TOKEN = process.env.BRIDGELET_SDK_TOKEN;

const UPSTREAM_TIMEOUT_MS = 10_000;

// Fail fast and loudly in server logs if misconfigured, instead of silently
// calling fetch(`${undefined}/accounts`) on every request.
function assertConfigured(): { sdkUrl: string; sdkToken: string } {
  if (!SDK_URL || !SDK_TOKEN) {
    console.error(
      '[bridgelet/accounts] Missing required env vars: BRIDGELET_SDK_URL and/or BRIDGELET_SDK_TOKEN'
    );
    throw new ConfigError();
  }
  return { sdkUrl: SDK_URL, sdkToken: SDK_TOKEN };
}

class ConfigError extends Error {}

// Only forward a safe, explicit allow-list of response headers upstream ->
// client. Blindly copying all upstream headers can leak internal
// infrastructure details (server, x-powered-by, cookies meant for the
// upstream's own domain, etc).
const FORWARDABLE_RESPONSE_HEADERS = ['content-type', 'retry-after'];

function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const key of FORWARDABLE_RESPONSE_HEADERS) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }
  // Fallback if upstream didn't send one (e.g. empty error body)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  // Account data is sensitive and per-request; never let a CDN or the
  // browser cache it.
  headers.set('Cache-Control', 'no-store');
  return headers;
}

async function forward(
  path: string,
  init: RequestInit,
  requestId: string
): Promise<NextResponse> {
  let sdkUrl: string;
  let sdkToken: string;
  try {
    ({ sdkUrl, sdkToken } = assertConfigured());
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(`${sdkUrl}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${sdkToken}`,
        'X-Request-Id': requestId,
      },
      signal: controller.signal,
    });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.error(
      `[bridgelet/accounts] upstream fetch failed (requestId=${requestId})`,
      isAbort ? 'timed out' : err
    );
    return NextResponse.json(
      { error: isAbort ? 'Upstream request timed out' : 'Upstream request failed' },
      { status: isAbort ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }

  const data = await upstream.text();
  return new NextResponse(data, {
    status: upstream.status,
    headers: buildResponseHeaders(upstream),
  });
}

function getRequestId(req: NextRequest): string {
  return req.headers.get('x-request-id') ?? crypto.randomUUID();
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const raw = await req.text();

  // Validate that we're actually forwarding well-formed JSON instead of
  // blindly relaying whatever bytes the client sent (garbage in becomes a
  // confusing upstream 400/500 that's hard to debug, and this also guards
  // against forwarding non-JSON payloads to a JSON API).
  if (raw.length > 0) {
    try {
      JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }
  }

  return forward(
    '/accounts',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
    },
    requestId
  );
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const qs = req.nextUrl.search;

  return forward('/accounts' + qs, { method: 'GET' }, requestId);
}