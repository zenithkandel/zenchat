/**
 * ZenChat Design System — Spacing
 *
 * 8pt grid rhythm for consistent vertical and horizontal spacing.
 */

export const spacing = {
  /** 2px — hairline separators */
  xxs: 2,
  /** 4px — tight internal padding */
  xs: 4,
  /** 8px — standard small gap */
  sm: 8,
  /** 12px — comfortable small padding */
  md: 12,
  /** 16px — standard content padding */
  lg: 16,
  /** 20px — relaxed padding */
  xl: 20,
  /** 24px — section gaps */
  xxl: 24,
  /** 32px — large section gaps */
  xxxl: 32,
  /** 40px — screen-level breathing room */
  huge: 40,
  /** 48px — major vertical sections */
  massive: 48,
  /** 64px — extreme spacing (empty states, hero) */
  extreme: 64,
} as const;

export type SpacingKey = keyof typeof spacing;
