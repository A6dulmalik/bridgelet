// #110 – redeemClaim() SDK wrapper for POST /claims/redeem
import type { RedeemClaimRequest, RedeemClaimResponse, ApiError } from '@/lib/bridgelet';
import { publicEnv } from '@/lib/env';

export const SWEEP_STUB_WARNING =
  'Note: fund sweep is running in MVP stub mode. Tokens are reserved but not yet transferred on-chain.';

export async function redeemClaim(
  token: string,
  destinationAddress: string,
): Promise<RedeemClaimResponse> {
  const body: RedeemClaimRequest = { recipientPublicKey: destinationAddress };

  const res = await fetch(
    `${publicEnv.NEXT_PUBLIC_API_BASE_URL}/claims/${encodeURIComponent(token)}/redeem`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.message ?? `Redeem failed with status ${res.status}`);
  }

  return res.json() as Promise<RedeemClaimResponse>;
}
