/**
 * useMobileWallet.ts
 *
 * Issue #478: Mobile wallet connection.
 *
 * Acceptance criteria:
 *  ✅ Supports at least one mobile-native Stellar wallet (LOBSTR via deep link)
 *  ✅ App-switch-and-return flow: leaves to sign, returns to correct app state
 *  ✅ Clear error state when the wallet app is not installed
 *
 * Strategy:
 *  1. Primary: LOBSTR deep link handoff (most popular mobile Stellar wallet)
 *  2. The hook exposes a `connect()` method that initiates the app-switch,
 *     and a `handleReturnUrl()` method called when Bridgelet is re-opened
 *     via its own deep link after the wallet interaction completes.
 *  3. Session state is persisted in AsyncStorage so it survives the app-switch.
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WalletConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface WalletSession {
  publicKey: string;
  walletId: 'lobstr' | 'manual';
  connectedAt: number;
}

export interface UseMobileWalletResult {
  status: WalletConnectionStatus;
  session: WalletSession | null;
  error: string | null;
  /** Initiate wallet connection via deep link app-switch. */
  connect: (walletId?: 'lobstr') => Promise<void>;
  /** Process the return deep link after app-switch. */
  handleReturnUrl: (url: string) => void;
  /** Manually set a public key (for users without a wallet app). */
  connectManual: (publicKey: string) => void;
  disconnect: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = '@bridgelet:wallet-session';
const PENDING_CONNECTION_KEY = '@bridgelet:wallet-pending';

// Bridgelet's own scheme that LOBSTR will redirect back to
const BRIDGELET_SCHEME = 'bridgelet';
const BRIDGELET_CALLBACK = `${BRIDGELET_SCHEME}://wallet/callback`;

// LOBSTR SEP-7 deep link
// https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0007.md
function buildLobstrConnectUrl(): string {
  const params = new URLSearchParams({
    callback: BRIDGELET_CALLBACK,
    msg: 'Connect your LOBSTR wallet to Bridgelet',
  });
  return `lobstr://sep7?${params.toString()}`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const STELLAR_PUBLIC_KEY_RE = /^G[A-Z2-7]{55}$/;

function isValidPublicKey(key: string): boolean {
  return STELLAR_PUBLIC_KEY_RE.test(key.trim());
}

// ─── Return URL parsing ───────────────────────────────────────────────────────

function parseCallbackUrl(url: string): { publicKey?: string } {
  try {
    const parsed = new URL(url);
    const pk = parsed.searchParams.get('publicKey') ?? parsed.searchParams.get('pk');
    return pk ? { publicKey: pk } : {};
  } catch {
    return {};
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMobileWallet(): UseMobileWalletResult {
  const [status, setStatus] = useState<WalletConnectionStatus>('disconnected');
  const [session, setSession] = useState<WalletSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load persisted session on mount
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((raw) => {
      if (!raw) return;
      try {
        const s = JSON.parse(raw) as WalletSession;
        setSession(s);
        setStatus('connected');
      } catch {
        AsyncStorage.removeItem(SESSION_KEY);
      }
    });
  }, []);

  const persistSession = useCallback(async (s: WalletSession) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }, []);

  // ── Connect via LOBSTR deep link ────────────────────────────────────────────
  const connect = useCallback(async (walletId: 'lobstr' = 'lobstr') => {
    setError(null);
    setStatus('connecting');

    const url = buildLobstrConnectUrl();

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      setStatus('error');
      setError(null); // Surface via Alert for better UX
      Alert.alert(
        'LOBSTR Not Installed',
        'LOBSTR wallet is not installed on this device. Install it from the app store and try again, or enter your Stellar address manually.',
        [
          {
            text: Platform.OS === 'ios' ? 'Open App Store' : 'Open Play Store',
            onPress: () => {
              const storeUrl =
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/lobstr-stellar-wallet/id1404357892'
                  : 'https://play.google.com/store/apps/details?id=com.lobstr.client';
              Linking.openURL(storeUrl);
            },
          },
          { text: 'Cancel', style: 'cancel', onPress: () => setStatus('disconnected') },
        ],
      );
      return;
    }

    // Save pending state so we can resume on return
    await AsyncStorage.setItem(PENDING_CONNECTION_KEY, walletId);
    await Linking.openURL(url);
  }, []);

  // ── Handle return URL after app-switch ─────────────────────────────────────
  const handleReturnUrl = useCallback(
    (url: string) => {
      if (!url.startsWith(BRIDGELET_CALLBACK)) return;

      AsyncStorage.removeItem(PENDING_CONNECTION_KEY);

      const { publicKey } = parseCallbackUrl(url);
      if (!publicKey || !isValidPublicKey(publicKey)) {
        setStatus('error');
        setError('Wallet connection failed. Could not retrieve your public key.');
        return;
      }

      const newSession: WalletSession = {
        publicKey,
        walletId: 'lobstr',
        connectedAt: Date.now(),
      };
      setSession(newSession);
      setStatus('connected');
      persistSession(newSession);
    },
    [persistSession],
  );

  // ── Manual connection (enter Stellar address directly) ──────────────────────
  const connectManual = useCallback(
    (publicKey: string) => {
      if (!isValidPublicKey(publicKey)) {
        setError('Invalid Stellar address. Please check and try again.');
        return;
      }
      const newSession: WalletSession = {
        publicKey: publicKey.trim(),
        walletId: 'manual',
        connectedAt: Date.now(),
      };
      setSession(newSession);
      setStatus('connected');
      setError(null);
      persistSession(newSession);
    },
    [persistSession],
  );

  // ── Disconnect ──────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setSession(null);
    setStatus('disconnected');
    setError(null);
    AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  // Register deep-link listener for return from wallet app
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith(BRIDGELET_CALLBACK)) handleReturnUrl(url);
    });
    return () => sub.remove();
  }, [handleReturnUrl]);

  return { status, session, error, connect, handleReturnUrl, connectManual, disconnect };
}
