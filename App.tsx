/**
 * ZenChat — App Entry Point
 *
 * Root component that sets up:
 * - Theme provider (dark/light mode)
 * - Safe area provider
 * - Navigation
 * - Identity loading
 * - BLE initialization
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { useIdentityStore } from './src/state/stores/useIdentityStore';
import { logger } from './src/utils/logger';

// Suppress known non-critical warnings in dev
if (__DEV__) {
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
  ]);
}

function AppContent() {
  const loadIdentity = useIdentityStore(s => s.loadIdentity);

  useEffect(() => {
    logger.info('APP', 'ZenChat starting...');
    loadIdentity();
    logger.info('APP', 'Identity loaded');
  }, [loadIdentity]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
