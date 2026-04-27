import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

interface ShareSheetProps {
  visible: boolean;
  claimUrl: string;
  recipientName: string;
  onClose: () => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  visible,
  claimUrl,
  recipientName,
  onClose,
}) => {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link to clipboard');
      console.error('[ShareSheet] Failed to copy link:', error);
    }
  };

  const handleShareLink = async () => {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Not Available', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(claimUrl, {
        mimeType: 'text/plain',
        dialogTitle: `Share claim link with ${recipientName}`,
        UTI: 'public.plain-text',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share link');
      console.error('[ShareSheet] Failed to share link:', error);
    }
  };

  const handleShowQR = () => {
    setShowQR(true);
  };

  const handleCloseQR = () => {
    setShowQR(false);
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            entering={SlideInUp}
            style={styles.sheetContainer}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.header}>
                <View style={styles.sheetIndicator} />
                <Text style={styles.sheetTitle}>Share Claim Link</Text>
                <Text style={styles.sheetSubtitle}>
                  Send this link to {recipientName} so they can claim their funds
                </Text>
              </View>

              <View style={styles.linkPreview}>
                <Text style={styles.linkText} numberOfLines={2}>
                  {claimUrl}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleCopyLink}
                >
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionIconText}>
                      {copied ? '✓' : '📋'}
                    </Text>
                  </View>
                  <Text style={styles.actionButtonText}>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShareLink}
                >
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionIconText}>📤</Text>
                  </View>
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShowQR}
                >
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionIconText}>⬜</Text>
                  </View>
                  <Text style={styles.actionButtonText}>QR Code</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={handleCloseQR}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCloseQR}
        >
          <Animated.View
            entering={FadeIn}
            style={styles.qrContainer}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.qrHeader}>
                <Text style={styles.qrTitle}>QR Code</Text>
                <Text style={styles.qrSubtitle}>
                  {recipientName} can scan this to claim
                </Text>
              </View>

              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={claimUrl}
                  size={250}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity
                style={styles.qrCloseButton}
                onPress={handleCloseQR}
              >
                <Text style={styles.qrCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  sheetIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkPreview: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#334155',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
  },
  qrCloseButton: {
    backgroundColor: '#3B82F6',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  qrCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
