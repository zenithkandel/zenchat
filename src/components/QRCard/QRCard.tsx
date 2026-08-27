/**
 * ZenChat Component — QRCard
 *
 * Renders an offline-generated QR code using Skia GPU acceleration
 * with graceful fallback.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-skia';
import { useTheme } from '../../theme';

interface QRCardProps {
  value: string;
  size?: number;
  style?: ViewStyle;
}

export function QRCard({ value, size = 200, style }: QRCardProps) {
  const { colors, radii } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          width: size + 32,
          height: size + 32,
          backgroundColor: '#FFFFFF',
          borderRadius: radii.md,
        },
        style,
      ]}
    >
      {value ? (
        <QRCode
          value={value}
          size={size}
          color="#000000"
          errorCorrectionLevel="M"
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Generating identity…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
  },
});
