import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  authenticateSensitiveAction,
  getBiometricDeviceSupport,
  isBiometricEnabled,
  savePinCode,
  setBiometricEnabled,
  verifyPinCode,
  type BiometricDeviceSupport,
} from "../src/security/auth";

export default function SecuritySetupScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [support, setSupport] = useState<BiometricDeviceSupport | null>(null);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinFallback, setPinFallback] = useState("");
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    setIsLoading(true);
    try {
      const [deviceSupport, biometricsOn] = await Promise.all([
        getBiometricDeviceSupport(),
        isBiometricEnabled(),
      ]);
      setSupport(deviceSupport);
      setBiometricEnabledState(biometricsOn);
    } catch {
      setErrorMessage("Unable to load security settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const handleEnableBiometrics = async () => {
    setErrorMessage(null);
    setMessage(null);
    setIsBusy(true);
    try {
      await setBiometricEnabled(true);
      setBiometricEnabledState(true);
      setMessage("Biometric authentication enabled.");
    } catch {
      setErrorMessage("Unable to enable biometrics.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisableBiometrics = async () => {
    setErrorMessage(null);
    setMessage(null);
    setIsBusy(true);
    try {
      await setBiometricEnabled(false);
      setBiometricEnabledState(false);
      setMessage("Biometric authentication disabled.");
    } catch {
      setErrorMessage("Unable to update biometric preference.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSavePin = async () => {
    setErrorMessage(null);
    setMessage(null);
    setIsBusy(true);
    try {
      await savePinCode(pinInput);
      setPinInput("");
      setMessage("PIN saved. It will be used as fallback.");
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Unable to save PIN.";
      setErrorMessage(text);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSensitiveAction = async () => {
    setErrorMessage(null);
    setMessage(null);
    setShowPinFallback(false);
    setPinFallback("");
    setIsBusy(true);

    try {
      const result = await authenticateSensitiveAction();
      if (result.isAuthorized) {
        setMessage("Authentication success. Sensitive action unlocked.");
        return;
      }

      if (result.requiresPin) {
        setShowPinFallback(true);
      }

      setErrorMessage(result.errorMessage ?? "Authentication failed.");
    } catch {
      setErrorMessage("Authentication failed. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handlePinFallback = async () => {
    setErrorMessage(null);
    setMessage(null);
    setIsBusy(true);

    try {
      const success = await verifyPinCode(pinFallback);
      if (!success) {
        setErrorMessage("Incorrect PIN.");
        return;
      }

      setShowPinFallback(false);
      setPinFallback("");
      setMessage("PIN accepted. Sensitive action unlocked.");
    } catch {
      setErrorMessage("Unable to verify PIN.");
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#38BDF8" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Security Setup</Text>
        <Text style={styles.subtitle}>
          Enable biometrics for supported devices and configure PIN fallback for
          sensitive actions.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Biometric Support</Text>
          <Text style={styles.cardText}>
            Hardware: {support?.hasHardware ? "Yes" : "No"}
          </Text>
          <Text style={styles.cardText}>
            Enrolled: {support?.isEnrolled ? "Yes" : "No"}
          </Text>
          <Text style={styles.cardText}>
            Status: {biometricEnabled ? "Enabled" : "Disabled"}
          </Text>
          {support?.reason ? (
            <Text style={styles.warningText}>{support.reason}</Text>
          ) : null}

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleEnableBiometrics}
              disabled={isBusy || !support?.canUseBiometrics}
            >
              <Text style={styles.primaryButtonText}>Enable Biometrics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleDisableBiometrics}
              disabled={isBusy}
            >
              <Text style={styles.secondaryButtonText}>Disable</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>PIN Fallback</Text>
          <TextInput
            value={pinInput}
            onChangeText={setPinInput}
            keyboardType="number-pad"
            placeholder="Enter 4-8 digit PIN"
            placeholderTextColor="#64748B"
            secureTextEntry
            style={styles.input}
            maxLength={8}
          />
          <TouchableOpacity
            style={styles.primaryButtonWide}
            onPress={handleSavePin}
            disabled={isBusy}
          >
            <Text style={styles.primaryButtonText}>Save PIN</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sensitive Action Demo</Text>
          <TouchableOpacity
            style={styles.primaryButtonWide}
            onPress={handleSensitiveAction}
            disabled={isBusy}
          >
            <Text style={styles.primaryButtonText}>Authenticate</Text>
          </TouchableOpacity>

          {showPinFallback ? (
            <View style={styles.pinFallbackWrap}>
              <TextInput
                value={pinFallback}
                onChangeText={setPinFallback}
                keyboardType="number-pad"
                placeholder="Enter PIN"
                placeholderTextColor="#64748B"
                secureTextEntry
                style={styles.input}
                maxLength={8}
              />
              <TouchableOpacity
                style={styles.secondaryButtonWide}
                onPress={handlePinFallback}
                disabled={isBusy}
              >
                <Text style={styles.secondaryButtonText}>Submit PIN</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {isBusy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color="#38BDF8" />
            <Text style={styles.busyText}>Working...</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0B1220",
    padding: 12,
    gap: 10,
  },
  cardTitle: {
    color: "#E2E8F0",
    fontWeight: "700",
    fontSize: 16,
  },
  cardText: {
    color: "#CBD5E1",
  },
  warningText: {
    color: "#FBBF24",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#111827",
    color: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonWide: {
    borderRadius: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#475569",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonWide: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#475569",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#E2E8F0",
    fontWeight: "600",
    fontSize: 14,
  },
  pinFallbackWrap: {
    gap: 8,
    marginTop: 6,
  },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  busyText: {
    color: "#BAE6FD",
  },
  errorText: {
    color: "#FCA5A5",
    backgroundColor: "#3F1D1D",
    padding: 10,
    borderRadius: 10,
    borderColor: "#7F1D1D",
    borderWidth: 1,
  },
  successText: {
    color: "#86EFAC",
    backgroundColor: "#133024",
    padding: 10,
    borderRadius: 10,
    borderColor: "#166534",
    borderWidth: 1,
  },
});
