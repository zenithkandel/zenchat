/**
 * ZenChat Screen — My QR
 *
 * Premium QR code display with identity info.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useIdentityStore } from '../../state/stores/useIdentityStore';
import { identityService } from '../../identity/identityService';
import { shortId } from '../../utils/uuid';

export function MyQRScreen() {
  const navigation = useNavigation();
  const { colors, typography: typo, spacing: sp, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const identity = useIdentityStore(s => s.identity);

  const qrString = identityService.encodeQRString();

  const handleShare = async () => {
    if (!qrString) return;
    try {
      await Share.share({
        message: qrString,
        title: 'My ZenChat Identity',
      });
    } catch {
      // User cancelled
    }
  };

  const handleCopy = () => {
    // In a real app, use Clipboard.setString
    Alert.alert('Copied', 'Identity data copied to clipboard');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + sp.lg }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          accessibilityLabel="Close"
        >
          <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[typo.headline, { color: colors.textPrimary }]}>My QR Code</Text>
        <View style={styles.closeButton} />
      </View>

      {/* QR Card */}
      <View style={styles.content}>
        <View
          style={[
            styles.qrCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.lg,
            },
          ]}
        >
          {/* QR Code Placeholder — will be replaced with react-native-qrcode-skia */}
          <View
            style={[
              styles.qrPlaceholder,
              {
                backgroundColor: '#FFFFFF',
                borderRadius: radii.md,
              },
            ]}
          >
            <Text style={styles.qrPlaceholderText}>
              📱{'\n'}QR Code{'\n'}
              <Text style={{ fontSize: 10, color: '#999' }}>
                {identity?.userId ? shortId(identity.userId) : ''}
              </Text>
            </Text>
          </View>

          <Text style={[typo.title3, { color: colors.textPrimary, marginTop: sp.xxl, textAlign: 'center' }]}>
            {identity?.displayName ?? 'Unknown'}
          </Text>

          <Text style={[typo.footnote, { color: colors.textMuted, marginTop: sp.xs, textAlign: 'center' }]}>
            Your nearby identity
          </Text>

          <Text style={[typo.caption1, { color: colors.textMuted, marginTop: sp.lg, textAlign: 'center', lineHeight: 18 }]}>
            Others can scan this{'\n'}to identify you.
          </Text>
        </View>

        {/* Actions */}
        <View style={[styles.actions, { marginTop: sp.xxl }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent, borderRadius: radii.md }]}
            onPress={handleShare}
            accessibilityLabel="Share your identity"
          >
            <Text style={[typo.callout, { color: colors.accentText, fontWeight: '600' }]}>
              Share
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: 'transparent',
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radii.md,
              },
            ]}
            onPress={handleCopy}
            accessibilityLabel="Copy identity data"
          >
            <Text style={[typo.callout, { color: colors.textPrimary, fontWeight: '500' }]}>
              Copy identity
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  qrCard: {
    alignItems: 'center',
    padding: 32,
    borderWidth: StyleSheet.hairlineWidth,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontSize: 28,
    textAlign: 'center',
    color: '#333',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
});
