/**
 * Next.js instrumentation hook — runs once when the server process starts,
 * before any request is handled.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Stable (no experimental flag needed) as of the Next.js 16 this app is on.
 *
 * Starts the mock bridgelet-sdk server (frontend/lib/sdk/mocks/) by default
 * in local dev and CI, so neither depends on a live testnet/SDK instance.
 * Set E2E_USE_MOCKS=false to opt out and hit BRIDGELET_SDK_URL for real —
 * see frontend/lib/sdk/mocks/README.md for why this specific variable was
 * chosen and how it interacts with .github/workflows/compatibility.yml.
 *
 * If this repo already has an instrumentation.ts (or one under src/),
 * merge this register() body into the existing one instead of having two.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return; // skip edge runtime
  if (process.env.NODE_ENV === 'production') return; // never mock in a real deploy
  if (process.env.E2E_USE_MOCKS === 'false') return; // explicit opt-out (see README)

  const { mockSdkServer } = await import('./lib/sdk/mocks/server');
  mockSdkServer.listen({ onUnhandledRequest: 'bypass' });
  // eslint-disable-next-line no-console -- intentional one-line startup signal, not app logging
  console.log('[mock-sdk] bridgelet-sdk mock server active (set E2E_USE_MOCKS=false to disable)');
}