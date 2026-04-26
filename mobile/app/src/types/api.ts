/**
 * Metadata for ephemeral account creation
 */
export interface AccountMetadata {
  recipientName: string;
  message?: string;
  senderNote?: string;
}

/**
 * Request body for creating an ephemeral account
 */
export interface CreateAccountRequest {
  amount: string;
  asset: string; // Format: "ASSET_CODE:ISSUER"
  expiresIn: number; // in seconds
  metadata: AccountMetadata;
}

/**
 * Response body for creating an ephemeral account
 */
export interface CreateAccountResponse {
  accountId: string;
  publicKey: string;
  claimUrl: string;
  claimToken: string;
  txHash: string;
  amount: string;
  asset: string;
  status: 'pending_payment' | 'unclaimed' | 'claimed' | 'expired';
  expiresAt: string;
  createdAt: string;
}

/**
 * Standard API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

/**
 * Supported asset information
 */
export interface SupportedAsset {
  code: string;
  issuer: string;
  name: string;
  icon?: string;
}
