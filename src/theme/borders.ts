export const borders = {
  thin: 2,
  regular: 3,
  thick: 4,
  radius: {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 18,
    full: 9999,
  },
} as const;

export type Borders = typeof borders;
