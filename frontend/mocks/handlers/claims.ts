import { http, HttpResponse } from 'msw';

export const claimsHandlers = [
  http.post('/claims/redeem', () =>
    HttpResponse.json({
      txHash: 'mock-tx-hash-stub',
      explorerUrl: 'https://stellar.expert/explorer/testnet/tx/mock-tx-hash-stub',
      sweep_status: 'stub',
      sweepNote: 'Sweep is stubbed in MVP. Funds remain in the ephemeral account.',
    }),
  ),
];
