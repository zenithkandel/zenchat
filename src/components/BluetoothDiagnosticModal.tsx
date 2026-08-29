import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borders } from '../theme/borders';
import { BrutalistButton } from './BrutalistButton';
import { BrutalistCard } from './BrutalistCard';
import { BluetoothDiagnostic, BluetoothPermissions } from '../transport/BluetoothPermissions';
import { useIdentity } from '../identity/IdentityContext';
import { useTransport } from '../transport/TransportContext';
import { ShieldCheck, ShieldAlert, X, Radio, RefreshCw } from 'lucide-react-native';

interface BluetoothDiagnosticModalProps {
  visible: boolean;
  onClose: () => void;
  diagnostic: BluetoothDiagnostic | null;
  onRefreshPermissions: () => void;
}

export const BluetoothDiagnosticModal: React.FC<BluetoothDiagnosticModalProps> = ({
  visible,
  onClose,
  diagnostic,
  onRefreshPermissions,
}) => {
  const { identity } = useIdentity();
  const { isMock, status, toggleTransportMode, debugLogs } = useTransport();

  if (!visible) return null;

  const handleRequest = async () => {
    await BluetoothPermissions.requestPermissions();
    onRefreshPermissions();
  };

  const handleOpenSettings = () => {
    BluetoothPermissions.openSettings();
  };

  const renderStatusRow = (label: string, isOk: boolean, detail?: string) => (
    <View style={styles.statusRow}>
      <View style={styles.statusLabelContainer}>
        <Text style={styles.statusLabel}>{label}</Text>
        {detail ? <Text style={styles.statusDetail}>{detail}</Text> : null}
      </View>
      <View style={[styles.badge, isOk ? styles.badgeSuccess : styles.badgeError]}>
        <Text style={[styles.badgeText, isOk ? styles.badgeTextSuccess : styles.badgeTextError]}>
          {isOk ? 'GRANTED' : 'DENIED'}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <BrutalistCard style={styles.modalCard} shadowOffset={6}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.titleWithIcon}>
                <Radio size={22} color={colors.black} strokeWidth={2.5} />
                <Text style={[typography.title, styles.modalTitle]}>BLUETOOTH DIAGNOSTICS</Text>
              </View>
              <BrutalistButton
                title=""
                onPress={onClose}
                icon={<X size={18} color={colors.black} strokeWidth={2.5} />}
                variant="secondary"
                style={styles.closeBtn}
                shadowOffset={2}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Active Mode Notice */}
              <View style={styles.infoBanner}>
                <Text style={styles.bannerHeader}>
                  ACTIVE TRANSPORT: {isMock ? 'SIMULATOR (MOCK)' : 'REAL HARDWARE BLE'}
                </Text>
                <Text style={styles.bannerBody}>
                  Status: <Text style={{ fontWeight: '900' }}>{status.toUpperCase()}</Text>
                  {isMock
                    ? ' • Running mock peer simulation. Switch to Real BLE for phone-to-phone tests.'
                    : ' • Using direct hardware Bluetooth Low Energy (Zero Internet).'}
                </Text>
              </View>

              {/* Error Message if any */}
              {diagnostic?.errorMessage && (
                <View style={styles.errorAlert}>
                  <ShieldAlert size={20} color={colors.black} strokeWidth={2.5} />
                  <Text style={styles.errorAlertText}>{diagnostic.errorMessage}</Text>
                </View>
              )}

              {/* Android Permissions Breakdown */}
              {Platform.OS === 'android' && diagnostic && (
                <View style={styles.section}>
                  <Text style={[typography.label, styles.sectionHeader]}>
                    ANDROID RUNTIME PERMISSIONS
                  </Text>

                  {renderStatusRow('Nearby Devices Scan', diagnostic.scanGranted, 'BLUETOOTH_SCAN')}
                  {renderStatusRow(
                    'Bluetooth Advertising',
                    diagnostic.advertiseGranted,
                    'BLUETOOTH_ADVERTISE'
                  )}
                  {renderStatusRow('Bluetooth Connect', diagnostic.connectGranted, 'BLUETOOTH_CONNECT')}
                  {renderStatusRow(
                    'Location Services (BLE)',
                    diagnostic.locationGranted,
                    'ACCESS_FINE_LOCATION'
                  )}
                </View>
              )}

              {/* Identity & Device Info */}
              <View style={styles.section}>
                <Text style={[typography.label, styles.sectionHeader]}>DEVICE IDENTITY</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Display Name:</Text>
                  <Text style={styles.metaValue}>{identity?.displayName || 'Not Set'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Machine User ID:</Text>
                  <Text style={styles.metaValue}>{identity?.userId || 'Not Set'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Service UUID:</Text>
                  <Text style={styles.metaValueSmall}>0000FE60-0000-1000-8000-00805F9B34FB</Text>
                </View>
              </View>

              {/* Real-Time Bluetooth Hardware Console Logs */}
              <View style={styles.section}>
                <Text style={[typography.label, styles.sectionHeader]}>LIVE BLUETOOTH CONSOLE LOGS</Text>
                <View style={styles.logBox}>
                  {debugLogs && debugLogs.length > 0 ? (
                    debugLogs.map((logItem, idx) => (
                      <Text key={idx} style={styles.logLine}>
                        {logItem}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.logLineMuted}>
                      {isMock
                        ? 'Logs are available in Real BLE mode.'
                        : 'Waiting for Bluetooth events... Scanning/Advertising active.'}
                    </Text>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionSection}>
                {Platform.OS === 'android' && !diagnostic?.isGranted && (
                  <BrutalistButton
                    title="REQUEST PERMISSIONS"
                    onPress={handleRequest}
                    variant="primary"
                    style={styles.actionBtn}
                  />
                )}

                <BrutalistButton
                  title="OPEN SYSTEM SETTINGS"
                  onPress={handleOpenSettings}
                  variant="secondary"
                  style={styles.actionBtn}
                />

                <BrutalistButton
                  title={isMock ? 'SWITCH TO REAL BLE' : 'SWITCH TO MOCK DEMO'}
                  onPress={toggleTransportMode}
                  variant="secondary"
                  style={styles.actionBtn}
                />
              </View>
            </ScrollView>
          </BrutalistCard>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalCard: {
    maxHeight: '90%',
    padding: 20,
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: borders.regular,
    borderBottomColor: colors.black,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  closeBtn: {
    marginVertical: 0,
  },
  infoBanner: {
    backgroundColor: colors.offWhite,
    borderWidth: borders.thin,
    borderColor: colors.black,
    padding: 12,
    borderRadius: borders.radius.md,
    marginBottom: 16,
  },
  bannerHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.black,
    marginBottom: 4,
  },
  bannerBody: {
    fontSize: 12,
    color: colors.black,
    lineHeight: 16,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderWidth: borders.regular,
    borderColor: colors.black,
    padding: 12,
    borderRadius: borders.radius.md,
    marginBottom: 16,
    gap: 10,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: colors.black,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  statusLabelContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
  },
  statusDetail: {
    fontSize: 10,
    color: colors.mutedText,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borders.radius.sm,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  badgeSuccess: {
    backgroundColor: colors.white,
  },
  badgeError: {
    backgroundColor: colors.black,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  badgeTextSuccess: {
    color: colors.black,
  },
  badgeTextError: {
    color: colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.black,
  },
  metaValueSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.black,
  },
  logBox: {
    backgroundColor: colors.darkGray,
    borderWidth: borders.thin,
    borderColor: colors.black,
    borderRadius: borders.radius.sm,
    padding: 10,
    minHeight: 120,
    maxHeight: 180,
  },
  logLine: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#00FF66',
    marginBottom: 4,
  },
  logLineMuted: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.mutedText,
  },
  actionSection: {
    marginTop: 12,
    gap: 4,
  },
  actionBtn: {
    marginVertical: 4,
  },
});
