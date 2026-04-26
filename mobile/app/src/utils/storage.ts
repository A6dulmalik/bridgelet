import * as SecureStore from "expo-secure-store";

/**
 * Storage interface for consistent usage across the app.
 */
export interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * List of sensitive keys that should be cleared on logout/cleanup.
 * This can be expanded as new sensitive data is added to the app.
 */
export const SENSITIVE_KEYS = [
  "auth_token",
  "session_data",
  "temp_identifier",
  "user_profile",
  "private_key_hint",
  "biometric_enabled",
  "pin_code",
];

/**
 * Implementation of secure storage using Expo SecureStore.
 * This encrypts data at rest using platform-specific secure enclaves (Keychain/Keystore).
 */
class SecureStorageImpl implements IStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error(`[SecureStorage] Error reading key "${key}":`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`[SecureStorage] Error writing key "${key}":`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error deleting key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Clears all known sensitive keys from secure storage.
   * Note: SecureStore does not support clearing all keys at once.
   */
  async clear(): Promise<void> {
    try {
      const promises = SENSITIVE_KEYS.map((key) => this.removeItem(key));
      await Promise.all(promises);
      console.log(
        "[SecureStorage] Successfully cleared all known sensitive keys.",
      );
    } catch (error) {
      console.error("[SecureStorage] Error during cleanup:", error);
      throw error;
    }
  }
}

export const secureStorage: IStorage = new SecureStorageImpl();
