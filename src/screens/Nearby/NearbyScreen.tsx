/**
 * ZenChat Screen — Nearby
 *
 * Beautiful nearby peer discovery screen.
 * Shows scanning animation and discovered peers as cards.
 * Groups: Verified contacts vs Unknown nearby.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useNearbyStore } from '../../state/stores/useNearbyStore';
import { useContactStore } from '../../state/stores/useContactStore';
import { useBleStore } from '../../state/stores/useBleStore';
import { PeerCard } from '../../components/PeerCard/PeerCard';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import type { DiscoveredPeer } from '../../ble/BleTransport';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function NearbyScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const insets = useSafeAreaInsets();

  const peers = useNearbyStore(s => s.peers);
  const isScanning = useBleStore(s => s.isScanning);
  const bluetoothState = useBleStore(s => s.bluetoothState);
  const contacts = useContactStore(s => s.contacts);

  const isBluetoothReady = bluetoothState === 'poweredOn';
  const appPeers = peers.filter(p => p.isAppPeer);

  // Categorize peers
  const verifiedPeers = appPeers.filter(p =>
    contacts.some(c => c.verified && c.lastKnownBleId === p.bleId),
  );
  const otherPeers = appPeers.filter(p =>
    !contacts.some(c => c.verified && c.lastKnownBleId === p.bleId),
  );

  const handlePeerPress = useCallback((peer: DiscoveredPeer) => {
    const contact = contacts.find(c => c.lastKnownBleId === peer.bleId);
    if (contact) {
      navigation.navigate('Chat', {
        peerUserId: contact.userId,
        peerDisplayName: contact.displayName,
      });
    }
    // For unknown peers, we'd normally show identity confirmation
    // For now, navigate to chat if name is available
    else if (peer.name) {
      navigation.navigate('Chat', {
        peerUserId: peer.bleId,
        peerDisplayName: peer.name,
      });
    }
  }, [contacts, navigation]);

  if (!isBluetoothReady) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { paddingHorizontal: sp.xxl, paddingTop: sp.xxl }]}>
          <Text style={[typo.title1, { color: colors.textPrimary }]}>Nearby</Text>
        </View>
        <EmptyState
          title="Bluetooth is off"
          subtitle="Turn on Bluetooth to find and communicate with nearby people."
          actions={[{ label: 'Open Settings', onPress: () => {}, primary: true }]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#FAFAFA' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      <View style={[styles.header, { paddingTop: insets.top + sp.xxl, paddingHorizontal: sp.xxl }]}>
        <Text style={[typo.title1, { color: colors.textPrimary }]}>Nearby</Text>
        <Text style={[typo.subheadline, { color: colors.textSecondary, marginTop: sp.xs }]}>
          People using this app nearby
        </Text>

        {/* Scanning indicator */}
        {isScanning && (
          <View style={[styles.scanningRow, { marginTop: sp.lg }]}>
            <Text style={[styles.scanDot, { color: colors.accent }]}>◌</Text>
            <Text style={[typo.footnote, { color: colors.textMuted }]}>
              Scanning nearby
            </Text>
          </View>
        )}

        {appPeers.length > 0 && (
          <Text style={[typo.footnote, { color: colors.textSecondary, marginTop: sp.sm }]}>
            {appPeers.length} {appPeers.length === 1 ? 'person' : 'people'} found
          </Text>
        )}
      </View>

      {appPeers.length === 0 ? (
        <EmptyState
          title="Nobody nearby"
          subtitle="Make sure Bluetooth is enabled and keep the other device close."
          actions={[{ label: 'Scan again', onPress: () => {}, primary: true }]}
        />
      ) : (
        <FlatList
          data={appPeers}
          keyExtractor={item => item.bleId}
          contentContainerStyle={{ paddingHorizontal: sp.xxl, paddingTop: sp.lg, paddingBottom: sp.massive }}
          ItemSeparatorComponent={() => <View style={{ height: sp.md }} />}
          renderItem={({ item }) => {
            const contact = contacts.find(c => c.lastKnownBleId === item.bleId);
            return (
              <PeerCard
                name={item.name ?? 'Unknown'}
                userId={contact?.userId}
                connectionState="nearby"
                isVerified={contact?.verified}
                isContact={!!contact}
                onPress={() => handlePeerPress(item)}
              />
            );
          }}
          ListHeaderComponent={
            verifiedPeers.length > 0 && otherPeers.length > 0 ? (
              <Text style={[typo.caption1, { color: colors.textMuted, marginBottom: sp.sm, textTransform: 'uppercase', letterSpacing: 1 }]}>
                Verified
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanDot: {
    fontSize: 18,
  },
});
