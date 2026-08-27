/**
 * ZenChat Component — Connection Badge
 *
 * Human-friendly connection status indicator.
 * Shows: ● Nearby, ○ Connecting..., — Not nearby, etc.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

export type ConnectionDisplayState =
  | 'nearby'
  | 'connecting'
  | 'connected'
  | 'justNow'
  | 'away'
  | 'unavailable';

interface ConnectionBadgeProps {
  state: ConnectionDisplayState;
  compact?: boolean;
}

const STATE_LABELS: Record<ConnectionDisplayState, string> = {
  nearby: 'Nearby',
  connecting: 'Connecting…',
  connected: 'Connected',
  justNow: 'Just now',
  away: 'Away',
  unavailable: 'Not nearby',
};

const STATE_ACCESSIBILITY: Record<ConnectionDisplayState, string> = {
  nearby: 'Nearby and available',
  connecting: 'Connecting to this person',
  connected: 'Connected and ready',
  justNow: 'Seen just now',
  away: 'Away from nearby range',
  unavailable: 'Not nearby',
};

export function ConnectionBadge({ state, compact = false }: ConnectionBadgeProps) {
  const { colors } = useTheme();

  const dotColor = (() => {
    switch (state) {
      case 'nearby':
        return colors.nearby;
      case 'connecting':
        return colors.connecting;
      case 'connected':
        return colors.connected;
      case 'justNow':
        return colors.success;
      case 'away':
        return colors.warning;
      case 'unavailable':
        return colors.unavailable;
    }
  })();

  const indicator = (() => {
    switch (state) {
      case 'nearby':
      case 'connecting':
      case 'connected':
      case 'justNow':
        return '●';
      case 'away':
        return '○';
      case 'unavailable':
        return '—';
    }
  })();

  return (
    <View
      style={styles.container}
      accessibilityLabel={STATE_ACCESSIBILITY[state]}
    >
      <Text style={[styles.dot, { color: dotColor }]}>{indicator}</Text>
      {!compact && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {STATE_LABELS[state]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    fontSize: 10,
    lineHeight: 14,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
});
