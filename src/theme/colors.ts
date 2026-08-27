/**
 * ZenChat Design System — Colors
 *
 * Restrained, premium color palette.
 * Neutral backgrounds with sparing accent usage.
 * Semantic tokens for light and dark modes.
 */

export const palette = {
  // Neutrals
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray150: '#EFEFEF',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray850: '#1C1C1E',
  gray900: '#171717',
  gray950: '#0A0A0A',
  black: '#000000',

  // Accent — a calm, confident blue
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',

  // Semantic
  green50: '#F0FDF4',
  green400: '#4ADE80',
  green500: '#22C55E',
  green600: '#16A34A',

  amber50: '#FFFBEB',
  amber400: '#FBBF24',
  amber500: '#F59E0B',

  red50: '#FEF2F2',
  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',

  // Teal for nearby/connected states
  teal400: '#2DD4BF',
  teal500: '#14B8A6',
  teal600: '#0D9488',
} as const;

export interface ColorScheme {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  surfacePressed: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Borders
  border: string;
  borderLight: string;

  // Accent
  accent: string;
  accentLight: string;
  accentPressed: string;
  accentText: string;

  // Semantic
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;

  // Chat
  bubbleSent: string;
  bubbleSentText: string;
  bubbleReceived: string;
  bubbleReceivedText: string;

  // Status
  nearby: string;
  connecting: string;
  connected: string;
  unavailable: string;

  // Overlays
  overlay: string;
  shimmer: string;

  // Navigation
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Input
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;

  // Card
  cardBackground: string;
  cardBorder: string;
}

export const lightColors: ColorScheme = {
  background: palette.gray50,
  surface: palette.white,
  surfaceElevated: palette.white,
  surfacePressed: palette.gray100,

  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  textInverse: palette.white,

  border: palette.gray200,
  borderLight: palette.gray150,

  accent: palette.blue600,
  accentLight: palette.blue50,
  accentPressed: palette.blue700,
  accentText: palette.white,

  success: palette.green500,
  successLight: palette.green50,
  warning: palette.amber500,
  warningLight: palette.amber50,
  danger: palette.red500,
  dangerLight: palette.red50,

  bubbleSent: palette.blue600,
  bubbleSentText: palette.white,
  bubbleReceived: palette.gray150,
  bubbleReceivedText: palette.gray900,

  nearby: palette.teal500,
  connecting: palette.amber500,
  connected: palette.green500,
  unavailable: palette.gray400,

  overlay: 'rgba(0, 0, 0, 0.4)',
  shimmer: palette.gray200,

  tabBarBackground: palette.white,
  tabBarBorder: palette.gray200,
  tabBarActive: palette.blue600,
  tabBarInactive: palette.gray400,

  inputBackground: palette.gray100,
  inputBorder: palette.gray200,
  inputPlaceholder: palette.gray400,

  cardBackground: palette.white,
  cardBorder: palette.gray200,
};

export const darkColors: ColorScheme = {
  background: palette.gray950,
  surface: palette.gray900,
  surfaceElevated: palette.gray850,
  surfacePressed: palette.gray800,

  textPrimary: palette.gray100,
  textSecondary: palette.gray400,
  textMuted: palette.gray500,
  textInverse: palette.gray900,

  border: palette.gray800,
  borderLight: palette.gray850,

  accent: palette.blue500,
  accentLight: 'rgba(59, 130, 246, 0.12)',
  accentPressed: palette.blue400,
  accentText: palette.white,

  success: palette.green400,
  successLight: 'rgba(34, 197, 94, 0.12)',
  warning: palette.amber400,
  warningLight: 'rgba(245, 158, 11, 0.12)',
  danger: palette.red400,
  dangerLight: 'rgba(239, 68, 68, 0.12)',

  bubbleSent: palette.blue600,
  bubbleSentText: palette.white,
  bubbleReceived: palette.gray800,
  bubbleReceivedText: palette.gray100,

  nearby: palette.teal400,
  connecting: palette.amber400,
  connected: palette.green400,
  unavailable: palette.gray600,

  overlay: 'rgba(0, 0, 0, 0.6)',
  shimmer: palette.gray800,

  tabBarBackground: palette.gray900,
  tabBarBorder: palette.gray800,
  tabBarActive: palette.blue500,
  tabBarInactive: palette.gray500,

  inputBackground: palette.gray850,
  inputBorder: palette.gray800,
  inputPlaceholder: palette.gray500,

  cardBackground: palette.gray900,
  cardBorder: palette.gray800,
};
