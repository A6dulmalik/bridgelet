import { http, HttpResponse } from 'msw';
import type {
  CreateAccountRequest,
  AccountResponse,
  AccountStatus,
  VerifyClaimRequest,
  RedeemClaimRequest,
  RedeemClaimResponse,
} from '@/lib/bridgelet';

/**
 * In-memory mock of bridgelet-sdk's account/claim store.
 *
 * Process-local and non-persistent: it exists to make
 * POST /accounts -> GET /accounts/:id -> POST /claims/verify ->
 * POST /claims/redeem behave like a real backend for the lifetime of one
 * `next dev` / CI process, not to simulate bridgelet-sdk's actual database.
 * Accounts are indexed by both `accountId` and the claim token embedded in
 * `claimUrl`, since /claims/* endpoints are looked up by claim token while
 * /accounts/:id is looked up by account id.
 */
const accounts = new Map<string, AccountResponse>();

function fakeStellarAddress(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let key = 'G';
  for (let i = 0; i < 55; i++) key += alphabet[Math.floor(Math.random() * alphabet.length)];
  return key;
}

function fakeTxHash(): string {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * Endpoints and fields mocked here must match scripts/check-sdk-contract.mjs's
 * `CONTRACT` array — that script is the single source of truth for what the
 * frontend depends on. See ./README.md for the update process, and the note
 * there on the known AccountStatus enum drift this mock intentionally does
 * NOT paper over.
 */
export const sdkHandlers = [
  // POST /accounts — create an ephemeral account.
  http.post('*/accounts', async ({ request }) => {
    const body = (await request.json()) as CreateAccountRequest;

    const accountId = crypto.randomUUID();
    const publicKey = fakeStellarAddress();
    const claimToken = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + (body.expiresIn ?? 86_400) * 1000).toISOString();
    const createdAt = new Date().toISOString();

    const account: AccountResponse = {
      accountId,
      publicKey,
      claimUrl: `/claim/${claimToken}`,
      amount: body.amount,
      asset: body.asset_code ?? 'XLM',
      status: 'pending' as AccountStatus,
      expiresAt,
      createdAt,
      metadata: body.metadata,
    };

    accounts.set(accountId, account);
    accounts.set(claimToken, account);

    return HttpResponse.json(account, { status: 201 });
  }),

  // GET /accounts/:id — check status.
  http.get('*/accounts/:id', ({ params }) => {
    const account = accounts.get(params['id'] as string);
    if (!account) {
      return HttpResponse.json(
        { error: 'not_found', message: `No account with id ${params['id']}`, statusCode: 404 },
        { status: 404 },
      );
    }
    return HttpResponse.json(account, { status: 200 });
  }),

  // POST /claims/verify — check a claim token before redemption.
  http.post('*/claims/verify', async ({ request }) => {
    const { claimToken } = (await request.json()) as VerifyClaimRequest;
    const account = accounts.get(claimToken);

    if (!account) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Unknown claim token.', statusCode: 404 },
        { status: 404 },
      );
    }
    if (account.status === 'expired' || new Date(account.expiresAt) < new Date()) {
      return HttpResponse.json(
        { error: 'expired', message: 'This claim link has expired.', statusCode: 410 },
        { status: 410 },
      );
    }
    if (account.status === 'claimed') {
      return HttpResponse.json(
        {
          error: 'already_claimed',
          message: 'This claim has already been redeemed.',
          statusCode: 409,
        },
        { status: 409 },
      );
    }

    return HttpResponse.json(
      {
        accountId: account.accountId,
        amount: account.amount,
        asset: account.asset,
        expiresAt: account.expiresAt,
      },
      { status: 200 },
    );
  }),

  // POST /claims/redeem — trigger the sweep.
  http.post('*/claims/redeem', async ({ request }) => {
    const { claimToken, destinationAddress } = (await request.json()) as RedeemClaimRequest;
    const account = accounts.get(claimToken);

    if (!account) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Unknown claim token.', statusCode: 404 },
        { status: 404 },
      );
    }
    if (account.status === 'claimed') {
      return HttpResponse.json(
        {
          error: 'already_claimed',
          message: 'This claim has already been redeemed.',
          statusCode: 409,
        },
        { status: 409 },
      );
    }

    account.status = 'claimed' as AccountStatus;
    account.claimedAt = new Date().toISOString();
    account.destination = destinationAddress;

    const response: RedeemClaimResponse = {
      success: true,
      txHash: fakeTxHash(),
      amountSwept: account.amount,
      asset: account.asset,
      destination: destinationAddress,
      sweptAt: account.claimedAt,
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  // GET /health — mirrors the real bridgelet-sdk health check
  // (.github/workflows/compatibility.yml polls this on the real backend).
  // Inert unless server-side code actually calls it; included for parity.
  http.get('*/health', () => HttpResponse.json({ status: 'ok' }, { status: 200 })),

  // GET /api/docs-json — minimal OpenAPI-shaped spec covering only the
  // paths/fields scripts/check-sdk-contract.mjs inspects. Lets that same
  // script validate THIS mock instead of trusting it by construction —
  // see ./README.md.
  http.get('*/api/docs-json', () =>
    HttpResponse.json({
      paths: {
        '/accounts': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    properties: {
                      fundingSource: {},
                      recovery_address: {},
                      amount: {},
                      expiresIn: {},
                    },
                  },
                },
              },
            },
            responses: {
              '201': {
                content: {
                  'application/json': {
                    schema: {
                      properties: {
                        accountId: {},
                        publicKey: {},
                        claimUrl: {},
                        amount: {},
                        asset: {},
                        status: {},
                        expiresAt: {},
                        createdAt: {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/accounts/{id}': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      properties: {
                        accountId: {},
                        publicKey: {},
                        claimUrl: {},
                        amount: {},
                        asset: {},
                        status: {},
                        expiresAt: {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/claims/verify': {
          post: {
            requestBody: {
              content: { 'application/json': { schema: { properties: { claimToken: {} } } } },
            },
            responses: {
              '200': { content: { 'application/json': { schema: { properties: {} } } } },
            },
          },
        },
        '/claims/redeem': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: { properties: { claimToken: {}, destinationAddress: {} } },
                },
              },
            },
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      properties: { success: {}, amountSwept: {}, asset: {}, destination: {} },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  ),
];

/** Clears all mock account/claim state. Useful between test cases. */
export function resetMockSdkState(): void {
  accounts.clear();
}