import React, { useMemo, useState } from "react";
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
import * as Clipboard from "expo-clipboard";
import { lookupClaimByToken, ClaimLookupResult } from "../src/claims/service";
import {
  getClaimTokenErrorMessage,
  sanitizeTokenInput,
  validateClaimToken,
} from "../src/claims/token";

const summarizeToken = (token: string): string => {
  if (token.length <= 36) {
    return token;
  }

  return `${token.slice(0, 18)}...${token.slice(-12)}`;
};

export default function ClaimTokenEntryScreen() {
  const [tokenInput, setTokenInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimLookupResult | null>(null);

  const normalizedToken = useMemo(
    () => sanitizeTokenInput(tokenInput),
    [tokenInput],
  );

  const handlePaste = async () => {
    const clipboardValue = await Clipboard.getStringAsync();
    if (!clipboardValue?.trim()) {
      setErrorMessage("Clipboard is empty.");
      return;
    }

    setTokenInput(sanitizeTokenInput(clipboardValue));
    setErrorMessage(null);
    setResult(null);
  };

  const handleLookup = async () => {
    setErrorMessage(null);
    setResult(null);

    try {
      validateClaimToken(normalizedToken);
    } catch (error) {
      setErrorMessage(getClaimTokenErrorMessage(error));
      return;
    }

    setIsLoading(true);
    try {
      const claim = await lookupClaimByToken(normalizedToken);
      setResult(claim);
    } catch (error) {
      setErrorMessage(getClaimTokenErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Enter Claim Token</Text>
        <Text style={styles.subtitle}>
          Paste a claim link or enter a claim token manually to verify
          availability.
        </Text>

        <TextInput
          value={tokenInput}
          onChangeText={setTokenInput}
          style={styles.tokenInput}
          placeholder="Paste token or URL"
          placeholderTextColor="#64748B"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={2400}
        />

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePaste}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Paste from Clipboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLookup}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>Lookup Claim</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#38BDF8" />
            <Text style={styles.loadingText}>Verifying claim token...</Text>
          </View>
        )}

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Claim Found</Text>
            <Text style={styles.resultRow}>Account: {result.accountId}</Text>
            <Text style={styles.resultRow}>Amount: {result.amount}</Text>
            <Text style={styles.resultRow}>Asset: {result.asset}</Text>
            {result.expiresAt ? (
              <Text style={styles.resultRow}>Expires: {result.expiresAt}</Text>
            ) : null}
            <Text style={styles.tokenLabel}>Token</Text>
            <Text selectable style={styles.tokenPreview}>
              {summarizeToken(normalizedToken)}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
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
  tokenInput: {
    minHeight: 140,
    maxHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#111827",
    padding: 12,
    color: "#E2E8F0",
    fontSize: 13,
    fontFamily: "Courier",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
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
  primaryButton: {
    flex: 1,
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
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  loadingText: {
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
  resultCard: {
    marginTop: 8,
    backgroundColor: "#0B1220",
    borderColor: "#1E293B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  resultTitle: {
    color: "#86EFAC",
    fontWeight: "700",
    marginBottom: 2,
  },
  resultRow: {
    color: "#E2E8F0",
  },
  tokenLabel: {
    color: "#94A3B8",
    marginTop: 8,
  },
  tokenPreview: {
    color: "#E2E8F0",
    fontFamily: "Courier",
  },
});
