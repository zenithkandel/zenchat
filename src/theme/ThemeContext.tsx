/**
 * ZenChat Design System — Theme Context
 *
 * Provides dark/light mode switching with system preference detection.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ColorScheme } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { radii } from './radii';
import { shadows } from './shadows';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorScheme;
  spacing: typeof spacing;
  typography: typeof typography;
  radii: typeof radii;
  shadows: typeof shadows;
}

interface ThemeContextValue {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialMode);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const theme: Theme = useMemo(
    () => ({
      mode: themeMode,
      isDark,
      colors: isDark ? darkColors : lightColors,
      spacing,
      typography,
      radii,
      shadows,
    }),
    [themeMode, isDark],
  );

  const value = useMemo(
    () => ({
      theme,
      setThemeMode,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context.theme;
}

export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void] {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return [context.theme.mode, context.setThemeMode];
}
