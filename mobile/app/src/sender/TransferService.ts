import { apiClient } from '../utils/apiClient';
import { CreateAccountRequest, CreateAccountResponse, SupportedAsset } from '../types/api';

/**
 * Service to handle transfer operations and ephemeral account management
 */
export class TransferService {
  /**
   * Create a new ephemeral account and initiate a transfer
   */
  static async createEphemeralAccount(
    request: CreateAccountRequest
  ): Promise<CreateAccountResponse> {
    try {
      const response = await apiClient<CreateAccountResponse>('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return response;
    } catch (error) {
      console.error('[TransferService] Failed to create ephemeral account:', error);
      throw error;
    }
  }

  /**
   * Fetch supported assets for transfers
   */
  static async getSupportedAssets(): Promise<SupportedAsset[]> {
    try {
      const response = await apiClient<{ assets: SupportedAsset[] }>('/api/assets', {
        method: 'GET',
        skipAuth: true, // Asset list is usually public
      });
      return response.assets;
    } catch (error) {
      console.error('[TransferService] Failed to fetch supported assets:', error);
      // Return defaults if API fails
      return [
        {
          code: 'XLM',
          issuer: 'native',
          name: 'Stellar Lumens',
        },
        {
          code: 'USDC',
          issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          name: 'USD Coin',
        },
      ];
    }
  }
}
