import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const readParam = (value: string | string[] | undefined, fallback = ''): string => {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
};

const summarizeMiddle = (value: string): string => {
  if (value.length <= 24) {
    return value;
  }

  return `${value.slice(0, 12)}...${value.slice(-10)}`;
};

export default function ClaimSuccessScreen() {
  const router = useRouter();
  const { amount, asset, accountId, txHash } = useLocalSearchParams();

  const parsedAmount = readParam(amount, '0');
  const parsedAsset = readParam(asset, 'XLM:native');
  const parsedAccountId = readParam(accountId, 'unknown-account');
  const parsedTxHash = readParam(txHash, '');

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const explorerUrl = parsedTxHash
    ? `https://stellar.expert/explorer/public/tx/${parsedTxHash}`
    : '';

  const handleOpenExplorer = async () => {
    if (!explorerUrl) {
      return;
    }

    const canOpen = await Linking.canOpenURL(explorerUrl);
    if (!canOpen) {
      Alert.alert('Unable to open explorer link right now.');
      return;
    }

    await Linking.openURL(explorerUrl);
  };

  const handleShare = async () => {
    const message = [
      'Claim completed on Bridgelet.',
      `Amount: ${parsedAmount} ${parsedAsset}`,
      `Account: ${parsedAccountId}`,
      parsedTxHash ? `Transaction: ${parsedTxHash}` : '',
      explorerUrl,
    ]
      .filter(Boolean)
      .join('\n');

    await Share.share({ message });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulse }] }]}> 
          <Text style={styles.icon}>✓</Text>
        </Animated.View>

        <Text style={styles.title}>Claim Successful</Text>
        <Text style={styles.subtitle}>
          Your transfer has been claimed and recorded successfully.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Transaction Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{parsedAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Asset</Text>
            <Text style={styles.value}>{parsedAsset}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Account</Text>
            <Text style={styles.value}>{summarizeMiddle(parsedAccountId)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Tx Hash</Text>
            <Text style={styles.value}>{summarizeMiddle(parsedTxHash || 'pending')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.secondaryButton, !explorerUrl && styles.disabledButton]}
          onPress={handleOpenExplorer}
          disabled={!explorerUrl}
        >
          <Text style={styles.secondaryText}>Open in Stellar Explorer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
          <Text style={styles.secondaryText}>Share Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/send')}
        >
          <Text style={styles.primaryText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    alignItems: 'stretch',
    gap: 12,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#166534',
    borderWidth: 1,
    borderColor: '#22C55E',
    marginTop: 8,
  },
  icon: {
    color: '#DCFCE7',
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 44,
  },
  title: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  summaryCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#94A3B8',
    fontSize: 14,
  },
  value: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0B1220',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.45,
  },
});
