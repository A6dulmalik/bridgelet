/**
 * Playwright configuration for the Bridgelet end-to-end integration test harness.
 *
 * These tests exercise the full user journey — create ephemeral account →
 * receive payment → claim funds — across the frontend (this repo), the
 * bridgelet-sdk backend, and, when available, a Stellar testnet contract
 * deployment from bridgelet-core.
 *
 * ## Running locally (all tests against MSW-mocked backend)
 *
 *   cd e2e
 *   npx playwright test
 *
 * ## Running against a real bridgelet-sdk instance
 *
 *   E2E_API_BASE_URL=http://localhost:3001 \
 *   E2E_USE_MOCKS=false \
 *   npx playwright test
 *
 * See e2e/README.md for full setup instructions.
 */

import { defineConfig, devices } from '@playwright/test';

const USE_MOCKS = process.env['E2E_USE_MOCKS'] !== 'false';

export default defineConfig({
  testDir: './tests',

  /**
   * Run each test file in parallel; within a file tests run sequentially so
   * shared state (account creation → claim) is deterministic.
   */
  fullyParallel: false,
  workers: process.env['CI'] ? 1 : undefined,

  /**
   * Fail the entire suite on `.only` left in source when running in CI.
   * Locally it is useful to focus a single test, so we allow it.
   */
  forbidOnly: !!process.env['CI'],

  /**
   * Retry flaky tests twice in CI to tolerate testnet timing variance.
   * No retries locally — immediate failure is more useful during development.
   */
  retries: process.env['CI'] ? 2 : 0,

  /**
   * GitHub Actions reporter annotates the PR check directly;
   * the list reporter is easier to read in a local terminal.
   */
  reporter: process.env['CI'] ? 'github' : 'list',

  use: {
    /**
     * All tests default to the local Next.js dev server.
     * Override with E2E_BASE_URL for staging/preview environments.
     */
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:3000',

    /**
     * Capture a full trace on the first retry of a failed test so failures
     * in CI can be diagnosed offline via `npx playwright show-report`.
     */
    trace: 'on-first-retry',

    /**
     * Screenshots on failure are captured automatically by Playwright;
     * keep them for the CI artifact upload.
     */
    screenshot: 'only-on-failure',

    /**
     * Disable service workers so MSW does not intercept fetch calls during
     * tests.  All API calls are handled by `page.route()` interceptors in
     * the test fixtures instead.
     *
     * Without this, MSW's browser service worker takes priority over
     * `page.route()` because it intercepts at the ServiceWorkerGlobalScope
     * fetch event level — Playwright's CDP network interception never sees
     * requests that MSW handles entirely inside the browser.
     */
    serviceWorkers: 'block',

    /**
     * Pass test-harness environment variables to the browser via
     * localStorage so the Next.js app can activate the right mock scenario.
     */
    storageState: USE_MOCKS ? undefined : undefined,
  },

  /**
   * Only run Chromium in CI to keep the scheduled job fast.
   * Add more projects locally if cross-browser coverage is needed.
   */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /**
   * Start the Next.js development server before the test suite.
   *
   * In CI, the server is always started fresh.
   * Locally, we re-use an already-running dev server to save the ~20 s
   * startup time on watch/iteration loops.
   *
   * The dev server activates MSW so all API calls are intercepted by the
   * mock handlers in frontend/mocks/ — no real bridgelet-sdk instance is
   * required for the default suite.
   */
  webServer: {
    command: 'cd ../frontend && npm run dev',
    url: process.env['E2E_BASE_URL'] ?? 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  outputDir: '../frontend/test-results',
});
