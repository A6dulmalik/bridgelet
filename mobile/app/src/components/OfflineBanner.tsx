/**
 * OfflineBanner.tsx
 *
 * Issue #481: Visible offline indicator — distinct from generic errors.
 *
 * Shows a sticky banner at the top of the screen when the device has no
 * internet connection. Dismisses automatically when connectivity returns.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  AccessibilityInfo,
} from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOnline, connectionType } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (!isOnline) {
      AccessibilityInfo.announceForAccessibility(
        'No internet connection. Some features may be unavailable.',
      );
    }
  }, [isOnline, slideAnim]);

  const label =
    connectionType === 'cellular'
      ? 'Poor connection — actions may be queued'
      : 'No internet connection';

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={label}
      pointerEvents="none"
    >
      <View style={styles.dot} />
      <Text style={styles.text}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#B45309',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FEF3C7',
  },
  text: {
    color: '#FEF3C7',
    fontSize: 13,
    fontWeight: '600',
  },
});
