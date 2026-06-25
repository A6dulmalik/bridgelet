import { http, HttpResponse, delay } from 'msw';

/** Generate a fake Stellar public key (G... 56 chars, base32 alphabet). */
function fakeStellarAddress(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let key = 'G';
  for (let i = 0; i < 55; i++) {
    key += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return key;
}

/** Generate a 32-byte hex claim token. */
function fakeClaimToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
}

/**
 * POST /api/accounts
 *
 * Returns a realistic ephemeral account object.
 * Simulates 300 ms of network latency to mirror production behaviour.
 */
export const accountHandlers = [
  http.post('/api/accounts', async () => {
    await delay(300);

    const stellarAddress = fakeStellarAddress();
    const claimToken = fakeClaimToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        publicKey: stellarAddress,
        stellarAddress,
        claimToken,
        claimUrl: `/claim/${claimToken}`,
        expiresAt,
        status: 'active',
        network: 'testnet',
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
];
