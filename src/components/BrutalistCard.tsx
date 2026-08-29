import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { borders } from '../theme/borders';

interface BrutalistCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  shadowOffset?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
}

export const BrutalistCard: React.FC<BrutalistCardProps> = ({
  children,
  style,
  contentStyle,
  shadowOffset = 5,
  backgroundColor = colors.white,
  borderColor = colors.black,
  borderRadius = borders.radius.lg,
}) => {
  return (
    <View style={[styles.wrapper, style]}>
      {/* Hard Offset Shadow */}
      <View
        style={[
          styles.shadow,
          {
            top: shadowOffset,
            left: shadowOffset,
            backgroundColor: borderColor,
            borderRadius,
          },
        ]}
      />

      {/* Surface */}
      <View
        style={[
          styles.card,
          {
            backgroundColor,
            borderColor,
            borderRadius,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginVertical: 8,
  },
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  card: {
    borderWidth: borders.regular,
    padding: 16,
  },
});
