/**
 * ZenChat Screen — Scan QR
 *
 * Camera viewfinder for scanning another user's identity QR code.
 * Validates payload schema and presents identity confirmation sheet.
 * Includes manual JSON/ID input fallback.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useContactStore } from '../../state/stores/useContactStore';
import { useIdentityStore } from '../../state/stores/useIdentityStore';
import { IdentityService, type QRIdentityPayload } from '../../identity/identityService';
import { requestCameraPermission } from '../../ble/BlePermissions';
import { Avatar } from '../../components/Avatar/Avatar';
import { shortId } from '../../utils/uuid';

export function ScanQRScreen() {
  const navigation = useNavigation();
  const { colors, typography: typo, spacing: sp, radii, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const myIdentity = useIdentityStore(s => s.identity);
  const { addContact, verifyContact } = useContactStore();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scannedIdentity, setScannedIdentity] = useState<QRIdentityPayload | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  useEffect(() => {
    requestCameraPermission().then(setHasPermission);
  }, []);

  const handleRecognizedPayload = useCallback((payload: QRIdentityPayload) => {
    if (payload.userId === myIdentity?.userId) {
      Alert.alert('Own Identity', 'You scanned your own QR code.');
      return;
    }

    setScannedIdentity(payload);
  }, [myIdentity]);

  const handleManualSubmit = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;

    const parsed = IdentityService.parseQRString(trimmed);
    if (!parsed) {
      Alert.alert('Invalid QR Data', 'The pasted data does not match the ZenChat identity format.');
      return;
    }

    handleRecognizedPayload(parsed);
  };

  const handleAddContact = () => {
    if (!scannedIdentity) return;

    addContact({
      userId: scannedIdentity.userId,
      displayName: scannedIdentity.displayName,
      publicKey: scannedIdentity.publicKey,
    });
    verifyContact(scannedIdentity.userId);

    Alert.alert(
      'Contact Verified ✓',
      `${scannedIdentity.displayName} has been added to your verified contacts.`,
      [{ text: 'Done', onPress: () => navigation.goBack() }],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + sp.md }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          accessibilityLabel="Close"
        >
          <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[typo.headline, { color: colors.textPrimary }]}>Scan Identity</Text>
        <TouchableOpacity
          onPress={() => setIsManualMode(!isManualMode)}
          style={styles.modeButton}
        >
          <Text style={[typo.caption1, { color: colors.accent, fontWeight: '600' }]}>
            {isManualMode ? 'Camera' : 'Paste'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Area */}
      {!scannedIdentity ? (
        <View style={styles.content}>
          {isManualMode ? (
            <View style={[styles.manualContainer, { paddingHorizontal: sp.xxl }]}>
              <Text style={[typo.title3, { color: colors.textPrimary }]}>Paste Identity Data</Text>
              <Text style={[typo.subheadline, { color: colors.textSecondary, marginTop: sp.xs }]}>
                Paste the exported identity string from another user.
              </Text>
              <TextInput
                style={[
                  styles.manualInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderRadius: radii.md,
                    color: colors.textPrimary,
                    marginTop: sp.lg,
                  },
                ]}
                placeholder='{"type":"USER_IDENTITY",...}'
                placeholderTextColor={colors.inputPlaceholder}
                value={manualInput}
                onChangeText={setManualInput}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.accent, borderRadius: radii.md, marginTop: sp.lg }]}
                onPress={handleManualSubmit}
              >
                <Text style={[typo.headline, { color: colors.accentText }]}>Verify Identity</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewfinderContainer}>
              <View style={[styles.viewfinderFrame, { borderColor: colors.accent }]}>
                <View style={[styles.scanLine, { backgroundColor: colors.accent }]} />
              </View>
              <Text style={[typo.subheadline, { color: colors.textSecondary, marginTop: sp.xl, textAlign: 'center' }]}>
                Align the QR code inside the frame
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* Identity Found Card */
        <View style={[styles.content, { paddingHorizontal: sp.xxl }]}>
          <View
            style={[
              styles.identityCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radii.lg,
              },
            ]}
          >
            <View style={[styles.successBadge, { backgroundColor: colors.successLight }]}>
              <Text style={[styles.successCheck, { color: colors.success }]}>✓ Identity Recognized</Text>
            </View>

            <View style={{ marginTop: sp.xl }}>
              <Avatar name={scannedIdentity.displayName} size={64} userId={scannedIdentity.userId} />
            </View>

            <Text style={[typo.title2, { color: colors.textPrimary, marginTop: sp.md }]}>
              {scannedIdentity.displayName}
            </Text>

            <Text style={[typo.footnote, { color: colors.textMuted, marginTop: 2 }]}>
              ID ···· {shortId(scannedIdentity.userId)}
            </Text>

            <View style={[styles.actionRow, { marginTop: sp.xxl }]}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.accent, borderRadius: radii.md, flex: 1 }]}
                onPress={handleAddContact}
              >
                <Text style={[typo.headline, { color: colors.accentText }]}>Add Contact</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border, borderRadius: radii.md }]}
                onPress={() => setScannedIdentity(null)}
              >
                <Text style={[typo.callout, { color: colors.textSecondary }]}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { fontSize: 18, fontWeight: '500' },
  modeButton: { paddingHorizontal: 12, paddingVertical: 6 },
  content: { flex: 1, justifyContent: 'center' },
  viewfinderContainer: { alignItems: 'center' },
  viewfinderFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '100%',
    height: 2,
    opacity: 0.8,
  },
  manualContainer: {},
  manualInput: {
    padding: 14,
    borderWidth: 1,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  identityCard: {
    padding: 28,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  successBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  successCheck: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
});
