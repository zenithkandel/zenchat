export const colors = {
  black: '#000000',
  white: '#FFFFFF',
  offWhite: '#F7F7F3',
  lightGray: '#E8E8E8',
  darkGray: '#151515',
  mutedText: '#666666',
  errorBackground: '#FFFFFF',
  errorBorder: '#000000',
  successBackground: '#FFFFFF',
  successBorder: '#000000',
} as const;

export type Colors = typeof colors;
