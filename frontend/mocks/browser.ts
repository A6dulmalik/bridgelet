import { setupWorker } from 'msw/browser';
import { accountHandlers } from './handlers/accounts';
import { horizonHandlers } from './handlers/horizon';
import { claimsHandlers } from './handlers/claims';

export const worker = setupWorker(...accountHandlers, ...horizonHandlers, ...claimsHandlers);
