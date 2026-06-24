/**
 * Bootstraps MSW in development.
 *
 * Import this module once at the app entry point (e.g. in layout.tsx) when
 * `process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'`.
 *
 * Usage:
 *   if (process.env.NODE_ENV === 'development') {
 *     const { initMocks } = await import('@/mocks');
 *     await initMocks();
 *   }
 */
export async function initMocks(): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side: use node handler (not wired up in this PR)
    return;
  }

  const { worker } = await import('./browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
}
