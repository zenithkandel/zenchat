/**
 * ZenChat Component — Peer Card
 *
 * Elegant card for displaying nearby peers.
 * Shows name, connection status, and signal strength.
 * NO technical details like UUID, MAC, or RSSI values.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../Avatar/Avatar';
import { ConnectionBadge, type ConnectionDisplayState } from '../ConnectionBadge/ConnectionBadge';

interface PeerCardProps {
  name: string;
  userId?: string;
  connectionState: ConnectionDisplayState;
  isVerified?: boolean;
  isContact?: boolean;
  onPress: () => void;
}

function getSignalLabel(state: ConnectionDisplayState): string | null {
  switch (state) {
    case 'nearby':
    case 'connected':
      return 'Strong';
    case 'connecting':
      return null;
    case 'away':
      return 'Weak';
    default:
      return null;
  }
}

export function PeerCard({
  name,
  userId,
  connectionState,
  isVerified,
  isContact,
  onPress,
}: PeerCardProps) {
  const { colors, spacing: sp, radii, shadows: sh } = useTheme();
  const signalLabel = getSignalLabel(connectionState);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          borderRadius: radii.md,
          padding: sp.lg,
          ...sh.sm,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${connectionState}`}
    >
      <View style={styles.row}>
        <Avatar name={name} size={44} userId={userId} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {isVerified && (
              <Text style={[styles.verifiedBadge, { color: colors.success }]}>✓</Text>
            )}
          </View>
          <View style={styles.statusRow}>
            <ConnectionBadge state={connectionState} />
            {signalLabel && (
              <Text style={[styles.signal, { color: colors.textMuted }]}>
                · {signalLabel}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  verifiedBadge: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  signal: {
    fontSize: 13,
  },
});
