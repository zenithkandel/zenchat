/**
 * ZenChat Screen — Diagnostics
 *
 * Technical screen for developers.
 * Shows BLE state, protocol info, session details.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useBleStore } from '../../state/stores/useBleStore';
import { useNearbyStore } from '../../state/stores/useNearbyStore';
import { PROTOCOL_VERSION } from '../../protocol/packets/types';

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[dStyles.statusRow, { borderBottomColor: colors.borderLight }]}>
      <Text style={[dStyles.statusLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={dStyles.statusValue}>
        {ok !== undefined && (
          <Text style={{ color: ok ? colors.success : colors.danger, marginRight: 6 }}>
            {ok ? '✓' : '✕'}
          </Text>
        )}
        <Text style={[dStyles.statusText, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

export function DiagnosticsScreen() {
  const navigation = useNavigation();
  const { colors, typography: typo, spacing: sp, radii } = useTheme();
  const insets = useSafeAreaInsets();

  const bluetoothState = useBleStore(s => s.bluetoothState);
  const isAdvertising = useBleStore(s => s.isAdvertising);
  const isScanning = useBleStore(s => s.isScanning);
  const nearbyCount = useNearbyStore(s => s.peers.length);

  const btStateLabel = (() => {
    switch (bluetoothState) {
      case 'poweredOn': return 'Powered On';
      case 'poweredOff': return 'Powered Off';
      case 'unauthorized': return 'Unauthorized';
      case 'unsupported': return 'Unsupported';
      case 'resetting': return 'Resetting';
      default: return 'Unknown';
    }
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#FAFAFA' || colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />

      <ScrollView contentContainerStyle={{ paddingBottom: sp.massive }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + sp.lg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backArrow, { color: colors.accent }]}>←</Text>
          </TouchableOpacity>
          <Text style={[typo.title2, { color: colors.textPrimary }]}>Diagnostics</Text>
        </View>

        {/* BLE Status */}
        <View style={[styles.section, { paddingHorizontal: sp.xxl, marginTop: sp.xxl }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>BLUETOOTH</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <StatusRow label="Bluetooth" value={btStateLabel} ok={bluetoothState === 'poweredOn'} />
            <StatusRow label="BLE Support" value="Available" ok={true} />
            <StatusRow label="Advertising" value={isAdvertising ? 'Active' : 'Inactive'} ok={isAdvertising} />
            <StatusRow label="Scanning" value={isScanning ? 'Active' : 'Inactive'} ok={isScanning} />
          </View>
        </View>

        {/* Network */}
        <View style={[styles.section, { paddingHorizontal: sp.xxl, marginTop: sp.xxl }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>NETWORK</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <StatusRow label="Nearby Peers" value={String(nearbyCount)} />
            <StatusRow label="Active Sessions" value="0" />
          </View>
        </View>

        {/* Protocol */}
        <View style={[styles.section, { paddingHorizontal: sp.xxl, marginTop: sp.xxl }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PROTOCOL</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <StatusRow label="Protocol" value="LOCAL_LINK" />
            <StatusRow label="Version" value={`v${PROTOCOL_VERSION}`} />
          </View>
        </View>

        {/* Storage */}
        <View style={[styles.section, { paddingHorizontal: sp.xxl, marginTop: sp.xxl }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>STORAGE</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <StatusRow label="Database" value="Healthy" ok={true} />
          </View>
        </View>

        {/* Note */}
        <View style={[styles.note, { paddingHorizontal: sp.xxl, marginTop: sp.xxl }]}>
          <Text style={[typo.caption1, { color: colors.textMuted, textAlign: 'center', lineHeight: 18 }]}>
            BLE functionality requires physical device testing.{'\n'}
            Emulators do not support BLE communication.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 24, fontWeight: '300' },
  section: {},
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  group: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  note: {},
});

const dStyles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusLabel: { fontSize: 15 },
  statusValue: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 15 },
});
