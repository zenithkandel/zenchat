import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { IdentityProvider, useIdentity } from './src/identity/IdentityContext';
import { TransportProvider, useTransport } from './src/transport/TransportContext';
import { SetupScreen } from './src/screens/SetupScreen';
import { NearbyScreen } from './src/screens/NearbyScreen';
import { SendMessageScreen } from './src/screens/SendMessageScreen';
import { IncomingMessageModal } from './src/screens/IncomingMessageModal';
import { Peer } from './src/transport/MessageTransport';

function MainApp() {
  const { identity, isLoading } = useIdentity();
  const { incomingMessage, dismissIncomingMessage } = useTransport();
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  // Step 1: Onboarding Setup
  if (!identity) {
    return <SetupScreen />;
  }

  // Step 2: Main Flow (Nearby or Send Screen)
  return (
    <View style={styles.rootContainer}>
      {selectedPeer ? (
        <SendMessageScreen
          recipient={selectedPeer}
          onBack={() => setSelectedPeer(null)}
          onSentSuccess={() => setSelectedPeer(null)}
        />
      ) : (
        <NearbyScreen
          onSelectPeer={(peer) => setSelectedPeer(peer)}
        />
      )}

      {/* Global Incoming Message Modal */}
      <IncomingMessageModal
        message={incomingMessage}
        onClose={dismissIncomingMessage}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={colors.offWhite} />
      <IdentityProvider>
        <TransportProvider>
          <MainApp />
        </TransportProvider>
      </IdentityProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
