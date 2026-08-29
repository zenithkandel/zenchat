import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { MessageTransport, Peer, TransportStatus } from './MessageTransport';
import { MockTransport } from './MockTransport';
import { RealBleTransport } from './RealBleTransport';
import { MessagePacket } from '../protocol/MessagePacket';
import { useIdentity } from '../identity/IdentityContext';

type TransportContextType = {
  transport: MessageTransport;
  peers: Peer[];
  status: TransportStatus;
  isMock: boolean;
  incomingMessage: MessagePacket | null;
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
  const [isMock, setIsMock] = useState<boolean>(true); // Defaults to Mock for Expo Go
  const [peers, setPeers] = useState<Peer[]>([]);
  const [status, setStatus] = useState<TransportStatus>('ready');
  const [incomingMessage, setIncomingMessage] = useState<MessagePacket | null>(null);

  const mockTransport = useMemo(() => new MockTransport(), []);
  const realTransport = useMemo(() => new RealBleTransport(), []);

  const activeTransport: MessageTransport = isMock ? mockTransport : realTransport;

  useEffect(() => {
    if (!identity) return;

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
  }, [identity, activeTransport]);

  const refreshPeers = useCallback(async () => {
    try {
      await activeTransport.discoverPeers();
    } catch (err) {
      console.error('Refresh peers failed:', err);
    }
  }, [activeTransport]);

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
