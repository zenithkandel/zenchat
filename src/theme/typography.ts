/**
 * ZenChat Design System — Typography
 *
 * Platform-friendly system fonts with clear hierarchy.
 * Comfortable line heights for legibility.
 */

import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const typography = {
  /** 34px — Splash/onboarding hero text */
  largeTitle: {
    fontFamily,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.37,
  } as TextStyle,

  /** 28px — Screen-level titles */
  title1: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0.36,
  } as TextStyle,

  /** 22px — Section headings */
  title2: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: 0.35,
  } as TextStyle,

  /** 20px — Sub-section headings */
  title3: {
    fontFamily,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: 0.38,
  } as TextStyle,

  /** 17px semibold — List headings, emphasis */
  headline: {
    fontFamily,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.41,
  } as TextStyle,

  /** 17px — Primary body copy */
  body: {
    fontFamily,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.41,
  } as TextStyle,

  /** 16px — Slightly smaller body, settings */
  callout: {
    fontFamily,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.32,
  } as TextStyle,

  /** 15px — Secondary info, subtitles */
  subheadline: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.24,
  } as TextStyle,

  /** 13px — Footnotes, timestamps */
  footnote: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  } as TextStyle,

  /** 12px — Captions, badges */
  caption1: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } as TextStyle,

  /** 11px — Tiny labels, metadata */
  caption2: {
    fontFamily,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    letterSpacing: 0.07,
  } as TextStyle,

  /** 14px monospace — JSON/code display */
  mono: {
    fontFamily: monoFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  } as TextStyle,

  /** 12px monospace — Compact code/IDs */
  monoSmall: {
    fontFamily: monoFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } as TextStyle,
} as const;

export type TypographyKey = keyof typeof typography;
