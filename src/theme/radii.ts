/**
 * ZenChat Design System — Corner Radii
 *
 * Consistent corner radius values.
 * Use rounded cards only where purposeful.
 */

export const radii = {
  /** 0px — No rounding */
  none: 0,
  /** 4px — Subtle rounding (badges, small chips) */
  xs: 4,
  /** 8px — Standard rounding (inputs, small cards) */
  sm: 8,
  /** 12px — Medium rounding (cards, sheets) */
  md: 12,
  /** 16px — Larger rounding (modals, panels) */
  lg: 16,
  /** 20px — Message bubbles */
  xl: 20,
  /** 24px — Hero elements */
  xxl: 24,
  /** Full rounding (avatars, pills) */
  full: 9999,
} as const;

export type RadiiKey = keyof typeof radii;
