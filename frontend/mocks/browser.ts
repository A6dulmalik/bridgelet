import { setupWorker } from 'msw/browser';
import { horizonHandlers } from './handlers/horizon';

/**
 * MSW service worker for browser environments.
 *
 * Start this once in development to intercept fetch/XHR calls.
 */
export const worker = setupWorker(...horizonHandlers);
