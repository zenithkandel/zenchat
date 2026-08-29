import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography: Record<string, TextStyle> = {
  hero: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    color: colors.black,
    textTransform: 'uppercase',
  },
  display: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.black,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.black,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.black,
    lineHeight: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.black,
    textTransform: 'uppercase',
  },
  tag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.black,
    textTransform: 'uppercase',
  },
  button: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: colors.black,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.mutedText,
  },
};
