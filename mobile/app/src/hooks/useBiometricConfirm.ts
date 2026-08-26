/**
 * useBiometricConfirm.ts
 *
 * Issue #480: Biometric confirmation for claim actions.
 *
 * Presents a biometric (Face ID / Touch ID / Fingerprint) prompt before
 * the caller proceeds with a sensitive action (e.g. finalising a claim).
 *
 * Behaviour:
 *  - If biometrics are enrolled and available  → prompt biometrics
 *  - If biometrics unavailable but device PIN  → fall back to PIN/passcode
 *  - If neither available                      → degrade safely (allow action)
 *
 * Usage:
 *   const { confirm, isAvailable } = useBiometricConfirm();
 *
 *   const handleClaim = async () => {
 *     const ok = await confirm('Confirm to claim your payment');
 *     if (!ok) return;
 *     // proceed with claim
 *   };
 */

import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, Platform } from 'react-native';

export type BiometricAvailability =
  | 'biometric'   // Face ID / Touch ID / fingerprint available and enrolled
  | 'pin'         // No biometrics but device PIN/passcode available
  | 'none';       // No authentication hardware or credentials

export interface UseBiometricConfirmResult {
  /** Whether biometrics or PIN are available on this device. */
  availability: BiometricAvailability;
  /** True when biometrics are fully available and enrolled. */
  isAvailable: boolean;
  /**
   * Show the confirmation prompt.
   * Resolves to `true` if the user authenticated successfully.
   * Resolves to `true` if no authentication is available (safe degradation).
   * Resolves to `false` if the user cancelled or failed.
   */
  confirm: (reason?: string) => Promise<boolean>;
}

export function useBiometricConfirm(): UseBiometricConfirmResult {
  const [availability, setAvailability] = useState<BiometricAvailability>('none');

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setAvailability('none');
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (enrolled) {
        setAvailability('biometric');
      } else {
        // Hardware present but no biometrics enrolled — fall back to device PIN
        setAvailability('pin');
      }
    })();
  }, []);

  const confirm = useCallback(
    async (reason = 'Confirm your identity to proceed'): Promise<boolean> => {
      // Safe degradation: if no auth is available, allow the action
      if (availability === 'none') return true;

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason,
          // Fall back to device passcode/PIN when biometrics fail or unavailable
          disableDeviceFallback: false,
          cancelLabel: 'Cancel',
          fallbackLabel: Platform.OS === 'ios' ? 'Use Passcode' : 'Use PIN',
        });

        if (result.success) return true;

        // User explicitly cancelled — do not show an extra error alert
        if (result.error === 'user_cancel' || result.error === 'system_cancel') {
          return false;
        }

        // Any other failure (too many attempts, lockout, etc.)
        Alert.alert(
          'Authentication Failed',
          'Could not verify your identity. Please try again.',
          [{ text: 'OK' }],
        );
        return false;
      } catch {
        // expo-local-authentication threw unexpectedly — degrade safely
        return true;
      }
    },
    [availability],
  );

  return {
    availability,
    isAvailable: availability !== 'none',
    confirm,
  };
}
