import { ViewStyle } from 'react-native';

export const hardShadow = (offsetX = 4, offsetY = 4, color = '#000000'): ViewStyle => {
  return {
    // In React Native 0.76+, boxShadow string is supported on Web & Native
    // We also support absolute underlay offset for rock-solid cross-platform rendering
    borderRightWidth: offsetX,
    borderBottomWidth: offsetY,
    borderColor: color,
  };
};

export const shadows = {
  sm: {
    offset: 2,
  },
  md: {
    offset: 4,
  },
  lg: {
    offset: 6,
  },
} as const;
