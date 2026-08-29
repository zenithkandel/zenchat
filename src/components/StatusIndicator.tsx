import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borders } from '../theme/borders';
import { TransportStatus } from '../transport/MessageTransport';

interface StatusIndicatorProps {
  status: TransportStatus;
  isMock: boolean;
  onToggleMock?: () => void;
  onSimulateIncoming?: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  isMock,
  onToggleMock,
  onSimulateIncoming,
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'searching':
        return {
          text: 'SEARCHING...',
          dotActive: true,
          accessibility: 'Searching for nearby devices.',
        };
      case 'connecting':
        return {
          text: 'CONNECTING...',
          dotActive: true,
          accessibility: 'Connecting to device.',
        };
      case 'bluetooth_off':
        return {
          text: 'BLUETOOTH OFF',
          dotActive: false,
          accessibility: 'Bluetooth is turned off.',
        };
      case 'error':
        return {
          text: 'CONNECTION ISSUE',
          dotActive: false,
          accessibility: 'Transport connection issue.',
        };
      case 'ready':
      default:
        return {
          text: 'READY',
          dotActive: true,
          accessibility: 'Ready to discover and send.',
        };
    }
  };

  const current = getStatusDisplay();

  return (
    <View style={styles.container}>
      {/* Human-Readable Status Badge */}
      <View
        style={styles.statusBadge}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={current.accessibility}
      >
        <View
          style={[
            styles.dot,
            current.dotActive ? styles.dotFilled : styles.dotHollow,
          ]}
        />
        <Text style={[typography.tag, styles.statusText]}>{current.text}</Text>
      </View>

      {/* Development Indicator for Expo Go */}
      {isMock && (
        <View style={styles.devContainer}>
          <Pressable
            onPress={onToggleMock}
            accessibilityRole="button"
            accessibilityLabel="Switch to hardware BLE"
            style={styles.demoBadge}
          >
            <Text style={styles.demoText}>DEMO MODE</Text>
          </Pressable>

          {onSimulateIncoming && (
            <Pressable
              onPress={onSimulateIncoming}
              accessibilityRole="button"
              accessibilityLabel="Simulate test message arrival"
              style={styles.testMsgBadge}
            >
              <Text style={styles.testMsgText}>+ TEST MSG</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: borders.thin,
    borderColor: colors.black,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borders.radius.full,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotFilled: {
    backgroundColor: colors.black,
  },
  dotHollow: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.black,
  },
  devContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoBadge: {
    backgroundColor: colors.lightGray,
    borderWidth: 1.5,
    borderColor: colors.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borders.radius.sm,
  },
  demoText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.black,
    letterSpacing: 0.5,
  },
  testMsgBadge: {
    backgroundColor: colors.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borders.radius.sm,
  },
  testMsgText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.5,
  },
});
