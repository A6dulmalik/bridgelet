import { secureStorage } from './storage';

/**
 * Cleanup utility to wipe sensitive data on logout or account deletion.
 */
export const cleanupSensitiveData = async (): Promise<void> => {
  try {
    await secureStorage.clear();
    // Here we can also add cleanup for other storage engines if used (e.g., AsyncStorage)
    console.log('[Cleanup] Sensitive data cleanup completed.');
  } catch (error) {
    console.error('[Cleanup] Error during sensitive data cleanup:', error);
    throw error;
  }
};

/**
 * Specific utility to check if the user has a stored session.
 */
export const hasStoredSession = async (): Promise<boolean> => {
  const token = await secureStorage.getItem('auth_token');
  return !!token;
};
