/**
 * ZenChat Screen — Home
 *
 * Immediately tells the user:
 * 1. Who they are
 * 2. Whether Bluetooth is ready
 * 3. How many peers are nearby
 * 4. Recent conversations
 * 5. What action they can take
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useIdentityStore } from '../../state/stores/useIdentityStore';
import { useBleStore } from '../../state/stores/useBleStore';
import { useNearbyStore } from '../../state/stores/useNearbyStore';
import { useConversationStore } from '../../state/stores/useConversationStore';
import { Avatar } from '../../components/Avatar/Avatar';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, typography: typo, spacing: sp, radii } = useTheme();
  const insets = useSafeAreaInsets();

  const identity = useIdentityStore(s => s.identity);
  const bluetoothState = useBleStore(s => s.bluetoothState);
  const peers = useNearbyStore(s => s.peers);
  const conversations = useConversationStore(s => s.conversations);

  const greeting = getGreeting();
  const isBluetoothReady = bluetoothState === 'poweredOn';
  const nearbyCount = peers.filter(p => p.isAppPeer).length;

  const recentConversations = [...conversations]
    .sort((a, b) => (b.lastMessageAt ?? b.updatedAt) - (a.lastMessageAt ?? a.updatedAt))
    .slice(0, 5);

  const openChat = useCallback((peerUserId: string, peerDisplayName: string) => {
    navigation.navigate('Chat', { peerUserId, peerDisplayName });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.textPrimary === '#FFFFFF' || colors.textPrimary === '#F5F5F5' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + sp.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: sp.xxl }]}>
          <View style={styles.headerText}>
            <Text style={[typo.title1, { color: colors.textPrimary }]}>
              {greeting}, {identity?.displayName ?? 'there'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyQR')}
            accessibilityLabel="View my QR code"
          >
            <Avatar
              name={identity?.displayName ?? '?'}
              size={44}
              userId={identity?.userId}
            />
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginHorizontal: sp.xxl, marginTop: sp.xxl }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusDot, { color: isBluetoothReady ? colors.success : colors.danger }]}>
              ●
            </Text>
            <Text style={[typo.callout, { color: colors.textPrimary }]}>
              {isBluetoothReady ? 'Ready to connect' : 'Bluetooth off'}
            </Text>
          </View>
          {nearbyCount > 0 && (
            <Text style={[typo.footnote, { color: colors.textSecondary, marginTop: sp.xs }]}>
              {nearbyCount} {nearbyCount === 1 ? 'person' : 'people'} nearby
            </Text>
          )}
        </View>

        {/* Nearby Action */}
        {nearbyCount > 0 ? (
          <TouchableOpacity
            style={[
              styles.nearbyAction,
              {
                backgroundColor: colors.accentLight,
                borderRadius: radii.md,
                marginHorizontal: sp.xxl,
                marginTop: sp.lg,
              },
            ]}
            onPress={() => (navigation as any).navigate('Nearby')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`See ${nearbyCount} nearby people`}
          >
            <Text style={[typo.callout, { color: colors.accent, fontWeight: '600' }]}>
              See nearby people →
            </Text>
          </TouchableOpacity>
        ) : (
          !isBluetoothReady && (
            <View
              style={[
                styles.nearbyAction,
                {
                  backgroundColor: colors.warningLight,
                  borderRadius: radii.md,
                  marginHorizontal: sp.xxl,
                  marginTop: sp.lg,
                },
              ]}
            >
              <Text style={[typo.callout, { color: colors.warning, fontWeight: '500' }]}>
                Turn on Bluetooth to find people nearby
              </Text>
            </View>
          )
        )}

        {/* Recent Conversations */}
        {recentConversations.length > 0 && (
          <View style={[styles.section, { marginTop: sp.xxxl, paddingHorizontal: sp.xxl }]}>
            <Text style={[typo.headline, { color: colors.textPrimary, marginBottom: sp.lg }]}>
              Recent
            </Text>

            {recentConversations.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={[styles.conversationRow, { borderBottomColor: colors.borderLight }]}
                onPress={() => openChat(conv.peerUserId, conv.peerDisplayName)}
                activeOpacity={0.6}
                accessibilityLabel={`Chat with ${conv.peerDisplayName}`}
              >
                <Avatar name={conv.peerDisplayName} size={44} userId={conv.peerUserId} />
                <View style={styles.convInfo}>
                  <View style={styles.convHeader}>
                    <Text style={[typo.callout, { color: colors.textPrimary, fontWeight: '600', flex: 1 }]} numberOfLines={1}>
                      {conv.peerDisplayName}
                    </Text>
                    {conv.lastMessageAt && (
                      <Text style={[typo.caption1, { color: colors.textMuted }]}>
                        {formatRelativeTime(conv.lastMessageAt)}
                      </Text>
                    )}
                  </View>
                  {conv.lastMessage && (
                    <Text style={[typo.subheadline, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                      {conv.lastMessage}
                    </Text>
                  )}
                </View>
                {conv.unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.badgeText, { color: colors.accentText }]}>
                      {conv.unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty state */}
        {recentConversations.length === 0 && (
          <View style={[styles.emptySection, { marginTop: sp.extreme }]}>
            <Text style={[typo.title3, { color: colors.textPrimary, textAlign: 'center' }]}>
              No conversations yet
            </Text>
            <Text style={[typo.subheadline, { color: colors.textSecondary, textAlign: 'center', marginTop: sp.sm }]}>
              Find someone nearby to start chatting
            </Text>
          </View>
        )}

        <View style={{ height: sp.massive }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: { flex: 1, marginRight: 16 },
  statusCard: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: { fontSize: 10 },
  nearbyAction: {
    padding: 14,
    alignItems: 'center',
  },
  section: {},
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  convInfo: { flex: 1 },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  emptySection: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
});
