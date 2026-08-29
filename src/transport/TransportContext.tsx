import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { MessageTransport, Peer, TransportStatus } from './MessageTransport';
import { MockTransport } from './MockTransport';
import { RealBleTransport } from './RealBleTransport';
import { MessagePacket } from '../protocol/MessagePacket';
import { useIdentity } from '../identity/IdentityContext';
import { BluetoothPermissions, BluetoothDiagnostic } from './BluetoothPermissions';

type TransportContextType = {
  transport: MessageTransport;
  peers: Peer[];
  status: TransportStatus;
  isMock: boolean;
  incomingMessage: MessagePacket | null;
  diagnostic: BluetoothDiagnostic | null;
  debugLogs: string[];
  refreshPermissions: () => Promise<void>;
  dismissIncomingMessage: () => void;
  refreshPeers: () => Promise<void>;
  sendMessage: (peerId: string, text: string) => Promise<void>;
  connect: (peerId: string) => Promise<void>;
  toggleTransportMode: () => void;
  simulateIncomingMessage: (senderName?: string, text?: string) => void;
};

const TransportContext = createContext<TransportContextType | null>(null);

export const TransportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { identity } = useIdentity();
  
  // In Standalone APK builds, default directly to RealBleTransport!
  // In Expo Go, default to MockTransport so that UI simulation works immediately.
  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    (Constants as any).appOwnership === 'expo';

  const [isMock, setIsMock] = useState<boolean>(isExpoGo);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [status, setStatus] = useState<TransportStatus>('ready');
  const [incomingMessage, setIncomingMessage] = useState<MessagePacket | null>(null);
  const [diagnostic, setDiagnostic] = useState<BluetoothDiagnostic | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const mockTransport = useMemo(() => new MockTransport(), []);
  const realTransport = useMemo(() => new RealBleTransport(), []);

  const activeTransport: MessageTransport = isMock ? mockTransport : realTransport;

  const refreshPermissions = useCallback(async () => {
    try {
      const diag = await BluetoothPermissions.checkPermissions();
      setDiagnostic(diag);
      if (!diag.isGranted && !isMock) {
        setStatus('error');
      }
    } catch {
      // Ignore
    }
  }, [isMock]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    if (!identity) return;

    // When in Real BLE mode, request permissions on start
    if (!isMock) {
      BluetoothPermissions.requestPermissions().then((diag) => {
        setDiagnostic(diag);
        if (!diag.isGranted) {
          setStatus('error');
        }
      });
    }

    activeTransport.start(identity).catch((err) => {
      console.warn('Transport start notice:', err);
    });

    const unsubscribePeers = activeTransport.onPeersChanged((updatedPeers) => {
      setPeers([...updatedPeers]);
    });

    const unsubscribeStatus = activeTransport.onStatusChanged((newStatus) => {
      setStatus(newStatus);
    });

    const unsubscribeMessage = activeTransport.onMessage((packet) => {
      setIncomingMessage(packet);
    });

    return () => {
      unsubscribePeers();
      unsubscribeStatus();
      unsubscribeMessage();
      activeTransport.stop().catch(() => {});
    };
  }, [identity, activeTransport, isMock]);

  const refreshPeers = useCallback(async () => {
    try {
      if (!isMock) {
        const diag = await BluetoothPermissions.checkPermissions();
        setDiagnostic(diag);
        if (!diag.isGranted) {
          const req = await BluetoothPermissions.requestPermissions();
          setDiagnostic(req);
          if (!req.isGranted) {
            setStatus('error');
            return;
          }
        }
      }
      await activeTransport.discoverPeers();
    } catch (err) {
      console.error('Refresh peers failed:', err);
    }
  }, [activeTransport, isMock]);

  const connect = useCallback(
    async (peerId: string) => {
      await activeTransport.connect(peerId);
    },
    [activeTransport]
  );

  const sendMessage = useCallback(
    async (peerId: string, text: string) => {
      await activeTransport.sendMessage(peerId, text);
    },
    [activeTransport]
  );

  const dismissIncomingMessage = useCallback(() => {
    setIncomingMessage(null);
  }, []);

  const toggleTransportMode = useCallback(() => {
    setIsMock((prev) => !prev);
  }, []);

  const simulateIncomingMessage = useCallback(
    (senderName = 'Jordan', text = 'Hello from nearby!') => {
      if (isMock) {
        mockTransport.simulateIncomingMessage(senderName, text);
      }
    },
    [isMock, mockTransport]
  );

  return (
    <TransportContext.Provider
      value={{
        transport: activeTransport,
        peers,
        status,
        isMock,
        incomingMessage,
        diagnostic,
        refreshPermissions,
        dismissIncomingMessage,
        refreshPeers,
        sendMessage,
        connect,
        toggleTransportMode,
        simulateIncomingMessage,
      }}
    >
      {children}
    </TransportContext.Provider>
  );
};

export const useTransport = () => {
  const context = useContext(TransportContext);
  if (!context) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
};
