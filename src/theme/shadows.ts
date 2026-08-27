/**
 * ZenChat Design System — Shadows
 *
 * Subtle, platform-appropriate shadows.
 * Avoid heavy shadows; keep the UI feeling light and calm.
 */

import { Platform, ViewStyle } from 'react-native';

export interface ShadowDefinition {
  style: ViewStyle;
}

const createShadow = (
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number,
): ViewStyle => {
  if (Platform.OS === 'android') {
    return { elevation };
  }

  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
  };
};

export const shadows = {
  /** No shadow */
  none: createShadow(0, 0, 0, 0),

  /** Subtle — cards, surfaces */
  sm: createShadow(1, 3, 0.06, 1),

  /** Standard — elevated surfaces, dropdowns */
  md: createShadow(2, 8, 0.08, 3),

  /** Prominent — modals, floating elements */
  lg: createShadow(4, 16, 0.1, 6),

  /** Maximum — full-screen overlays */
  xl: createShadow(8, 24, 0.12, 10),
} as const;

export type ShadowKey = keyof typeof shadows;
