import { http, HttpResponse } from 'msw';

const SESSION_KEY = 'bridgelet_mock_scenario';

function getScenario(): string {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? 'happy';
  } catch {
    return 'happy';
  }
}

export const claimsHandlers = [
  http.get('/claims/:token', () => {
    const scenario = getScenario();
    if (scenario === 'expired') {
      return HttpResponse.json({ status: 'expired', expiresAt: '2025-01-01T00:00:00Z' });
    }
    if (scenario === 'already-claimed') {
      return HttpResponse.json({ status: 'claimed' });
    }
    return HttpResponse.json({
      status: 'available',
      amountStroops: '50000000',
      assetCode: 'XLM',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      memo: 'Stub payment',
    });
  }),

  http.post('/claims/initiate', () =>
    HttpResponse.json({ token: 'mock-token-abc123', ephemeralAccount: 'GABC123' }, { status: 201 }),
  ),

  http.post('/claims/redeem', () => {
    const scenario = getScenario();
    if (scenario === 'network-error') {
      return HttpResponse.error();
    }
    if (scenario === 'expired') {
      return HttpResponse.json({ error: 'TOKEN_EXPIRED', message: 'This claim link has expired.' }, { status: 410 });
    }
    if (scenario === 'already-claimed') {
      return HttpResponse.json({ error: 'ALREADY_CLAIMED', message: 'This token has already been redeemed.' }, { status: 409 });
    }
    return HttpResponse.json({
      txHash: 'mock-tx-hash-0000000000000000000000000000000000000000000000000000000000000001',
      explorerUrl: 'https://stellar.expert/explorer/testnet/tx/mock-tx-hash',
      sweep_status: 'stub',
      sweepNote: 'Sweep is stubbed in MVP. Funds remain in the ephemeral account.',
    });
  }),
];
