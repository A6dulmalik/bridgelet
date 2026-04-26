import * as LocalAuthentication from "expo-local-authentication";
import { secureStorage } from "../utils/storage";

const BIOMETRIC_ENABLED_KEY = "biometric_enabled";
const PIN_CODE_KEY = "pin_code";
const PIN_PATTERN = /^\d{4,8}$/;

export type BiometricDeviceSupport = {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  canUseBiometrics: boolean;
  reason?: string;
};

export type SensitiveAuthResult = {
  isAuthorized: boolean;
  requiresPin: boolean;
  errorMessage?: string;
};

export const getBiometricDeviceSupport =
  async (): Promise<BiometricDeviceSupport> => {
    const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    if (!hasHardware) {
      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        canUseBiometrics: false,
        reason: "This device does not support biometric authentication.",
      };
    }

    if (!isEnrolled) {
      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        canUseBiometrics: false,
        reason:
          "No biometrics enrolled. Add Face ID or fingerprint in device settings.",
      };
    }

    if (supportedTypes.length === 0) {
      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        canUseBiometrics: false,
        reason: "No supported biometric types found on this device.",
      };
    }

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
      canUseBiometrics: true,
    };
  };

export const isBiometricEnabled = async (): Promise<boolean> => {
  return (await secureStorage.getItem(BIOMETRIC_ENABLED_KEY)) === "true";
};

export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  await secureStorage.setItem(
    BIOMETRIC_ENABLED_KEY,
    enabled ? "true" : "false",
  );
};

export const savePinCode = async (pin: string): Promise<void> => {
  if (!PIN_PATTERN.test(pin)) {
    throw new Error("PIN must be 4-8 digits.");
  }

  await secureStorage.setItem(PIN_CODE_KEY, pin);
};

export const hasPinCode = async (): Promise<boolean> => {
  const pin = await secureStorage.getItem(PIN_CODE_KEY);
  return typeof pin === "string" && pin.length > 0;
};

export const verifyPinCode = async (pin: string): Promise<boolean> => {
  const storedPin = await secureStorage.getItem(PIN_CODE_KEY);
  return Boolean(storedPin && storedPin === pin);
};

export const authenticateWithBiometrics = async (
  promptMessage: string,
): Promise<LocalAuthentication.LocalAuthenticationResult> => {
  return LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Cancel",
    fallbackLabel: "Use PIN",
    disableDeviceFallback: true,
  });
};

export const authenticateSensitiveAction =
  async (): Promise<SensitiveAuthResult> => {
    const [support, biometricsEnabled, pinEnabled] = await Promise.all([
      getBiometricDeviceSupport(),
      isBiometricEnabled(),
      hasPinCode(),
    ]);

    if (biometricsEnabled && support.canUseBiometrics) {
      const result = await authenticateWithBiometrics(
        "Authenticate to continue",
      );
      if (result.success) {
        return {
          isAuthorized: true,
          requiresPin: false,
        };
      }

      return {
        isAuthorized: false,
        requiresPin: pinEnabled,
        errorMessage:
          "Biometric authentication failed. Use your PIN to continue.",
      };
    }

    if (pinEnabled) {
      return {
        isAuthorized: false,
        requiresPin: true,
        errorMessage: support.reason ?? "Use your PIN to continue.",
      };
    }

    return {
      isAuthorized: false,
      requiresPin: false,
      errorMessage:
        support.reason ??
        "Set up biometrics or a PIN before using sensitive actions.",
    };
  };
