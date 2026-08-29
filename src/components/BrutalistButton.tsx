import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borders } from '../theme/borders';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost';

interface BrutalistButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  shadowOffset?: number;
  accessibilityLabel?: string;
}

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'right',
  shadowOffset = 4,
  accessibilityLabel,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 0,
      speed: 24,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 20,
    }).start();
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shadowOffset - 1],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shadowOffset - 1],
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
          shadow: styles.blackShadow,
        };
      case 'ghost':
        return {
          container: styles.ghostContainer,
          text: styles.ghostText,
          shadow: styles.transparentShadow,
        };
      case 'dark':
      case 'primary':
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
          shadow: styles.blackShadow,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View style={[styles.wrapper, style]}>
      {/* Hard Offset Shadow Layer */}
      <View
        style={[
          styles.shadowLayer,
          vStyles.shadow,
          {
            top: shadowOffset,
            left: shadowOffset,
            opacity: disabled ? 0.3 : 1,
          },
        ]}
      />

      {/* Tactile Animated Button Surface */}
      <Animated.View
        style={[
          styles.animatedContainer,
          vStyles.container,
          disabled && styles.disabledContainer,
          {
            transform: [{ translateX }, { translateY }],
          },
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || title}
          style={styles.pressableArea}
        >
          {loading ? (
            <ActivityIndicator
              color={variant === 'primary' ? colors.white : colors.black}
              size="small"
            />
          ) : (
            <View style={styles.contentRow}>
              {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
              <Text style={[typography.button, vStyles.text, disabled && styles.disabledText, textStyle]}>
                {title}
              </Text>
              {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginVertical: 6,
  },
  shadowLayer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.black,
    borderRadius: borders.radius.md,
  },
  blackShadow: {
    backgroundColor: colors.black,
  },
  transparentShadow: {
    backgroundColor: 'transparent',
  },
  animatedContainer: {
    borderRadius: borders.radius.md,
    borderWidth: borders.regular,
    borderColor: colors.black,
    overflow: 'hidden',
  },
  pressableArea: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryContainer: {
    backgroundColor: colors.black,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryContainer: {
    backgroundColor: colors.white,
  },
  secondaryText: {
    color: colors.black,
  },
  ghostContainer: {
    backgroundColor: colors.offWhite,
    borderColor: colors.black,
  },
  ghostText: {
    color: colors.black,
  },
  disabledContainer: {
    backgroundColor: colors.lightGray,
    borderColor: colors.mutedText,
  },
  disabledText: {
    color: colors.mutedText,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
