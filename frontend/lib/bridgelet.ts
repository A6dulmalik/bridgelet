/**
 * Bridgelet API TypeScript types
 */

// ─── Payment Intent ──────────────────────────────────────────────────────────

/** Request body for POST /send */
export interface CreateAccountRequest {
  fundingSource: string;
  recovery_address: string;
  amount: string;
  asset_code?: string;
  asset_issuer?: string;
  expiresIn: number;
  metadata?: Record<string, unknown>;
  signedTxXdr?: string;
  signerAddress?: string;
  networkPassphrase?: string;
  signingMode?: 'backend' | 'freighter-client';
}

export type AccountStatus = 'pending' | 'claimed' | 'expired';

/** Response from POST /send */
export interface AccountResponse {
  accountId: string;
  publicKey: string;
  claimUrl: string | null;
  txHash?: string;
  amount: string;
  asset: string;
  status: AccountStatus;
  expiresAt: string;
  createdAt: string;
  claimedAt?: string | null;
  destination?: string;
  metadata?: Record<string, unknown>;
}

export interface VerifyClaimRequest {
  claimToken: string;
}

/** Request body for POST /claim/:token/redeem */
export interface RedeemClaimRequest {
  claimToken: string;
  destinationAddress: string;
}

/** Response from POST /claim/:token/redeem */
export interface RedeemClaimResponse {
  success: boolean;
  txHash?: string;
  amountSwept: string;
  asset: string;
  destination: string;
  sweptAt?: string;
  message?: string;
  isPartial?: boolean;
  contractAuthHash?: string;
  error?: string;
}

// ─── Error envelope ──────────────────────────────────────────────────────────

/** Standard API error shape returned on 4xx / 5xx responses */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

import { BridgeletClient, type BridgeletClientOptions } from '@/lib/create-bridgelet-client';

export { BridgeletClient, type BridgeletClientOptions };

let _defaultClient: BridgeletClient | null = null;

function defaultClient(): BridgeletClient {
  if (!_defaultClient) {
    _defaultClient = new BridgeletClient();
  }
  return _defaultClient;
}

export function redeemClaim(
  token: string,
  destinationAddress: string,
): Promise<RedeemClaimResponse> {
  return defaultClient().redeemClaim(token, destinationAddress);
}
