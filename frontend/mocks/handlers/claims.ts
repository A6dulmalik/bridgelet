import { http, HttpResponse } from 'msw';

export const claimsHandlers = [
  http.get('/claims/:token', ({ params }) => {
    const { token } = params as { token: string };
    return HttpResponse.json({
      token,
      amount: '100.0000000',
      asset: 'XLM',
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }),

  http.post('/claims/initiate', async () => {
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        claimToken: crypto.randomUUID().replace(/-/g, ''),
        status: 'created',
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.post('/claims/redeem', async () => {
    return HttpResponse.json({
      success: true,
      sweep_status: 'stub',
      redeemedAt: new Date().toISOString(),
    });
  }),
];
