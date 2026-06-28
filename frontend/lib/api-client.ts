// #103 – API client that injects X-API-Key header into every request
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

const API_KEY = process.env['NEXT_PUBLIC_API_KEY'] ?? '';

if (!API_KEY && process.env.NODE_ENV !== 'development') {
  console.warn('[bridgelet] NEXT_PUBLIC_API_KEY is not set. API requests may be rejected.');
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (API_KEY) headers.set('X-API-Key', API_KEY);

  return fetchWithTimeout(`${baseUrl}${path}`, { ...options, headers });
}
