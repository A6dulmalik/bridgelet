import { setupServer } from 'msw/node';
import { sdkHandlers } from './handlers';

/**
 * Node-side (server-side) mock of bridgelet-sdk, built with msw/node.
 *
 * Unlike frontend/mocks/ (msw/browser — intercepts requests made FROM the
 * browser, e.g. by DevToolbar-driven manual dev sessions), this intercepts
 * requests made BY this Next.js server process itself: the fetch() calls
 * inside app/api/accounts/*.ts Route Handlers, and anything else that calls
 * BRIDGELET_SDK_URL server-side. It patches Node's fetch/http within this
 * process only — it does not open a TCP port, so nothing needs to be
 * listening on BRIDGELET_SDK_URL for this to work.
 *
 * Started from ../../../instrumentation.ts. See ./README.md for how this
 * relates to scripts/check-sdk-contract.mjs and to frontend/mocks/.
 */
export const mockSdkServer = setupServer(...sdkHandlers);