/**
 * useNetworkStatus.ts
 *
 * Issue #481: Offline and poor-connectivity handling.
 *
 * Monitors network reachability and exposes:
 *  - `isOnline`         — current online/offline state
 *  - `isConnected`      — NetInfo isConnected flag
 *  - `connectionType`   — wifi / cellular / none / unknown
 *  - `retryQueue`       — actions queued while offline
 *  - `enqueue(action)`  — add an action to the retry queue
 *  - `flushQueue()`     — attempt all queued actions now (called automatically on reconnect)
 *
 * No silent data loss: queued actions are persisted to AsyncStorage so they
 * survive the app being backgrounded mid-transaction.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

const QUEUE_STORAGE_KEY = '@bridgelet:offline-queue';

export interface QueuedAction {
  id: string;
  type: 'claim' | 'send';
  payload: Record<string, unknown>;
  enqueuedAt: number;
}

export interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean | null;
  connectionType: string;
  retryQueue: QueuedAction[];
  enqueue: (action: Omit<QueuedAction, 'id' | 'enqueuedAt'>) => Promise<void>;
  flushQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

async function loadQueue(): Promise<QueuedAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedAction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Non-fatal — queue will be in memory only for this session
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNetworkStatus(
  onFlush?: (action: QueuedAction) => Promise<void>,
): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState('unknown');
  const [retryQueue, setRetryQueue] = useState<QueuedAction[]>([]);
  const wasOfflineRef = useRef(false);

  // Load persisted queue on mount
  useEffect(() => {
    loadQueue().then(setRetryQueue);
  }, []);

  // Listen to network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      setIsConnected(state.isConnected);
      setConnectionType(state.type);

      // Auto-flush queue when coming back online
      if (online && wasOfflineRef.current) {
        wasOfflineRef.current = false;
        flushQueueInternal();
      }
      if (!online) wasOfflineRef.current = true;
    });
    return unsubscribe;
  }, []);

  // Flush on app foregrounding (in case reconnected while backgrounded)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && isOnline && retryQueue.length > 0) {
        flushQueueInternal();
      }
    });
    return () => sub.remove();
  }, [isOnline, retryQueue]);

  const flushQueueInternal = useCallback(async () => {
    if (!onFlush) return;
    const current = await loadQueue();
    if (current.length === 0) return;

    const remaining: QueuedAction[] = [];
    for (const action of current) {
      try {
        await onFlush(action);
      } catch {
        // Keep in queue if flush fails
        remaining.push(action);
      }
    }
    setRetryQueue(remaining);
    await saveQueue(remaining);
  }, [onFlush]);

  const enqueue = useCallback(
    async (action: Omit<QueuedAction, 'id' | 'enqueuedAt'>) => {
      const entry: QueuedAction = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        enqueuedAt: Date.now(),
      };
      const updated = [...retryQueue, entry];
      setRetryQueue(updated);
      await saveQueue(updated);
    },
    [retryQueue],
  );

  const flushQueue = useCallback(async () => {
    await flushQueueInternal();
  }, [flushQueueInternal]);

  const clearQueue = useCallback(async () => {
    setRetryQueue([]);
    await saveQueue([]);
  }, []);

  return {
    isOnline,
    isConnected,
    connectionType,
    retryQueue,
    enqueue,
    flushQueue,
    clearQueue,
  };
}
