import { setupWorker } from 'msw/browser';
import { horizonHandlers } from './handlers/horizon';
import { accountHandlers } from './handlers/accounts';

/**
 * MSW service worker for browser environments.
 *
 * Start this once in development to intercept fetch/XHR calls.
 * The worker is only initialised when this module is imported.
 */
export const worker = setupWorker(...accountHandlers);
