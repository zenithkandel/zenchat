import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borders } from '../theme/borders';
import { Header } from '../components/Header';
import { StatusIndicator } from '../components/StatusIndicator';
import { PeerCard } from '../components/PeerCard';
import { BrutalistButton } from '../components/BrutalistButton';
import { BrutalistCard } from '../components/BrutalistCard';
import { BluetoothDiagnosticModal } from '../components/BluetoothDiagnosticModal';
import { useIdentity } from '../identity/IdentityContext';
import { useTransport } from '../transport/TransportContext';
import { BluetoothPermissions } from '../transport/BluetoothPermissions';
import { Peer } from '../transport/MessageTransport';
import { Users, AlertTriangle, ShieldAlert, Settings } from 'lucide-react-native';

interface NearbyScreenProps {
  onSelectPeer: (peer: Peer) => void;
  onEditProfile?: () => void;
}

export const NearbyScreen: React.FC<NearbyScreenProps> = ({
  onSelectPeer,
}) => {
  const { identity } = useIdentity();
  const {
    peers,
    status,
    isMock,
    diagnostic,
    refreshPermissions,
    refreshPeers,
    toggleTransportMode,
    simulateIncomingMessage,
  } = useTransport();

  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:root=Bluetooth').catch(() => {
        Linking.openSettings();
      });
    } else {
      Linking.openSettings();
    }
  };

  const handleRequestPermission = async () => {
    await BluetoothPermissions.requestPermissions();
    await refreshPermissions();
    await refreshPeers();
  };

  const isBluetoothOff = status === 'bluetooth_off';
  const isSearching = status === 'searching';
  const hasPermissionError = diagnostic && !diagnostic.isGranted && !isMock;
  const peerCount = peers.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <Header
          title="ZENCHAT"
          subtitle="Messages nearby."
          onRefresh={refreshPeers}
          isRefreshing={isSearching}
          rightAction={
            identity && (
              <View style={styles.identityTag}>
                <Text style={styles.identityName}>{identity.displayName}</Text>
                <Text style={styles.identityId}>ID · {identity.userId.substring(0, 4)}</Text>
              </View>
            )
          }
        />

        {/* Transport & Bluetooth Status Indicator (Tappable for Diagnostics) */}
        <StatusIndicator
          status={status}
          isMock={isMock}
          onToggleMock={toggleTransportMode}
          onSimulateIncoming={() => simulateIncomingMessage('Jordan', 'Hey! You there? 👋')}
          onOpenDiagnostics={() => setShowDiagnostics(true)}
          errorMessage={diagnostic?.errorMessage}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isSearching}
              onRefresh={refreshPeers}
              tintColor={colors.black}
              colors={[colors.black]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Permission Issue Warning Banner */}
          {hasPermissionError && (
            <BrutalistCard style={styles.permissionCard} shadowOffset={4}>
              <View style={styles.permissionHeader}>
                <ShieldAlert size={24} color={colors.black} strokeWidth={2.5} />
                <Text style={[typography.title, styles.permissionTitle]}>
                  PERMISSIONS REQUIRED
                </Text>
              </View>
              <Text style={[typography.body, styles.permissionBody]}>
                {diagnostic?.errorMessage ||
                  'Android requires "Nearby devices" permission to discover nearby ZenChat users via Bluetooth.'}
              </Text>
              <View style={styles.permissionBtnRow}>
                <BrutalistButton
                  title="GRANT PERMISSION"
                  onPress={handleRequestPermission}
                  variant="primary"
                  style={styles.halfBtn}
                  shadowOffset={3}
                />
                <BrutalistButton
                  title="SETTINGS"
                  onPress={handleOpenSettings}
                  variant="secondary"
                  style={styles.halfBtn}
                  shadowOffset={3}
                />
              </View>
            </BrutalistCard>
          )}

          {isBluetoothOff ? (
            /* Bluetooth Off State */
            <BrutalistCard style={styles.stateCard} shadowOffset={5}>
              <View style={styles.iconCircle}>
                <AlertTriangle size={32} color={colors.black} strokeWidth={2.5} />
              </View>
              <Text style={[typography.title, styles.stateTitle]}>BLUETOOTH IS OFF</Text>
              <Text style={[typography.body, styles.stateBody]}>
                Turn on Bluetooth to find and message people nearby without internet.
              </Text>
              <BrutalistButton
                title="OPEN SETTINGS"
                onPress={handleOpenSettings}
                variant="primary"
                style={styles.stateButton}
              />
            </BrutalistCard>
          ) : peerCount === 0 ? (
            /* Empty State */
            <BrutalistCard style={styles.stateCard} shadowOffset={5}>
              <View style={styles.iconCircle}>
                <Users size={32} color={colors.black} strokeWidth={2.5} />
              </View>
              <Text style={[typography.title, styles.stateTitle]}>NOBODY NEARBY</Text>
              <Text style={[typography.body, styles.stateBody]}>
                {isMock
                  ? 'Tap "SCAN AGAIN" or toggle mode to test simulated peers.'
                  : 'ZenChat devices will appear here when they are within Bluetooth range (~10-30 meters) with the app open.'}
              </Text>
              <BrutalistButton
                title={isSearching ? 'SCANNING...' : 'SCAN AGAIN'}
                onPress={refreshPeers}
                loading={isSearching}
                variant="primary"
                style={styles.stateButton}
              />
              <BrutalistButton
                title="CHECK BLUETOOTH STATUS"
                onPress={() => setShowDiagnostics(true)}
                variant="secondary"
                style={styles.stateButton}
                shadowOffset={3}
              />
            </BrutalistCard>
          ) : (
            /* Peer List */
            <View style={styles.listContainer}>
              <View style={styles.sectionHeader}>
                <Text style={typography.label}>NEARBY</Text>
                <Text style={[typography.tag, styles.countBadge]}>
                  {peerCount} {peerCount === 1 ? 'PERSON' : 'PEOPLE'}
                </Text>
              </View>

              {peers.map((peer) => (
                <PeerCard
                  key={peer.userId}
                  peer={peer}
                  onPress={onSelectPeer}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Full Bluetooth Diagnostic Inspector Modal */}
        <BluetoothDiagnosticModal
          visible={showDiagnostics}
          onClose={() => setShowDiagnostics(false)}
          diagnostic={diagnostic}
          onRefreshPermissions={refreshPermissions}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  identityTag: {
    backgroundColor: colors.white,
    borderWidth: borders.thin,
    borderColor: colors.black,
    borderRadius: borders.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  identityName: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.black,
  },
  identityId: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.mutedText,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 32,
  },
  permissionCard: {
    backgroundColor: colors.white,
    marginBottom: 12,
    padding: 16,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  permissionBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  permissionBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfBtn: {
    flex: 1,
    marginVertical: 0,
  },
  listContainer: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: colors.black,
    color: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borders.radius.sm,
  },
  stateCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lightGray,
    borderWidth: borders.thin,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stateTitle: {
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  stateBody: {
    textAlign: 'center',
    color: colors.black,
    marginBottom: 18,
    lineHeight: 20,
  },
  stateButton: {
    width: '100%',
    marginVertical: 4,
  },
});
