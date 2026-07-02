import { setupWorker } from 'msw/browser';
import { accountHandlers } from './handlers/accounts';
import { claimsHandlers } from './handlers/claims';
import { horizonHandlers } from './handlers/horizon';

/**
 * MSW service worker for browser environments.
 *
 * Start this once in development to intercept fetch/XHR calls.
 * The worker is only initialised when this module is imported.
 */
<<<<<<< HEAD
export const worker = setupWorker(...accountHandlers, ...horizonHandlers, ...claimsHandlers);
=======
export const worker = setupWorker(...accountHandlers, ...claimsHandlers);
>>>>>>> a88a910139af745a7529d0cef32067a6f824e95d
