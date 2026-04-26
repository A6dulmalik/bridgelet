import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { secureStorage } from './src/utils/storage';
import { SenderFlow } from './src/sender/SenderFlow';

export default function HomeIndex() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const status = await secureStorage.getItem("has_onboarded");
      setHasOnboarded(status === "true");
    };
    checkOnboardingStatus();
  }, []);

  if (hasOnboarded === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <View style={styles.container}>
      <SenderFlow />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#94A3B8",
    marginTop: 10,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    width: "80%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderColor: "#334155",
    borderWidth: 1,
    width: "80%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
  },
});
