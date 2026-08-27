/**
 * ZenChat State — Settings Store
 */

import { create } from 'zustand';
import type { ThemeMode } from '../../theme';

interface SettingsState {
  themeMode: ThemeMode;
  nearbyVisibility: boolean;
  autoConnect: boolean;
  messageRetryEnabled: boolean;
  maxRetryAttempts: number;
  diagnosticsEnabled: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  setNearbyVisibility: (visible: boolean) => void;
  setAutoConnect: (enabled: boolean) => void;
  setMessageRetry: (enabled: boolean) => void;
  setMaxRetryAttempts: (max: number) => void;
  setDiagnosticsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: 'system',
  nearbyVisibility: true,
  autoConnect: true,
  messageRetryEnabled: true,
  maxRetryAttempts: 3,
  diagnosticsEnabled: false,

  setThemeMode: (mode) => set({ themeMode: mode }),
  setNearbyVisibility: (visible) => set({ nearbyVisibility: visible }),
  setAutoConnect: (enabled) => set({ autoConnect: enabled }),
  setMessageRetry: (enabled) => set({ messageRetryEnabled: enabled }),
  setMaxRetryAttempts: (max) => set({ maxRetryAttempts: max }),
  setDiagnosticsEnabled: (enabled) => set({ diagnosticsEnabled: enabled }),
}));
