import { MessagePacket } from '../protocol/MessagePacket';
import { UserIdentity } from '../identity/IdentityService';

export type Peer = {
  userId: string;
  displayName: string;
  state: 'nearby' | 'connecting' | 'connected';
};

export type TransportStatus = 'ready' | 'searching' | 'bluetooth_off' | 'connecting' | 'error';

export interface MessageTransport {
  readonly isMock: boolean;
  start(identity: UserIdentity): Promise<void>;
  stop(): Promise<void>;
  discoverPeers(): Promise<Peer[]>;
  connect(peerId: string): Promise<void>;
  sendMessage(peerId: string, text: string): Promise<void>;
  onPeersChanged(callback: (peers: Peer[]) => void): () => void;
  onMessage(callback: (packet: MessagePacket) => void): () => void;
  onStatusChanged(callback: (status: TransportStatus) => void): () => void;
  getStatus(): TransportStatus;
}
