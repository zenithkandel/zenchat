import { MessageTransport, Peer, TransportStatus } from './MessageTransport';
import { MessagePacket, createMessagePacket } from '../protocol/MessagePacket';
import { UserIdentity } from '../identity/IdentityService';

const DEFAULT_MOCK_PEERS: Peer[] = [
  { userId: 'J19D20', displayName: 'Jordan', state: 'nearby' },
  { userId: 'S44E11', displayName: 'Sam', state: 'nearby' },
  { userId: 'A7F29C', displayName: 'Alex', state: 'nearby' },
];

export class MockTransport implements MessageTransport {
  readonly isMock = true;
  private identity: UserIdentity | null = null;
  private status: TransportStatus = 'ready';
  private peers: Peer[] = [...DEFAULT_MOCK_PEERS];

  private peerListeners: Set<(peers: Peer[]) => void> = new Set();
  private messageListeners: Set<(packet: MessagePacket) => void> = new Set();
  private statusListeners: Set<(status: TransportStatus) => void> = new Set();

  private autoReplyTimeout: any = null;

  async start(identity: UserIdentity): Promise<void> {
    this.identity = identity;
    // Filter out our own identity if it matches any mock user
    this.peers = DEFAULT_MOCK_PEERS.filter((p) => p.userId !== identity.userId);
    this.setStatus('ready');
  }

  async stop(): Promise<void> {
    if (this.autoReplyTimeout) {
      clearTimeout(this.autoReplyTimeout);
      this.autoReplyTimeout = null;
    }
    this.setStatus('ready');
  }

  async discoverPeers(): Promise<Peer[]> {
    this.setStatus('searching');
    this.notifyPeers([]);

    return new Promise((resolve) => {
      setTimeout(() => {
        const activePeers = DEFAULT_MOCK_PEERS.filter(
          (p) => !this.identity || p.userId !== this.identity.userId
        );
        this.peers = activePeers.map((p) => ({ ...p, state: 'nearby' }));
        this.setStatus('ready');
        this.notifyPeers(this.peers);
        resolve(this.peers);
      }, 700);
    });
  }

  async connect(peerId: string): Promise<void> {
    const peer = this.peers.find((p) => p.userId === peerId);
    if (!peer) {
      throw new Error("Peer is no longer nearby.");
    }

    this.updatePeerState(peerId, 'connecting');
    await new Promise((resolve) => setTimeout(resolve, 400));
    this.updatePeerState(peerId, 'connected');
  }

  async sendMessage(peerId: string, text: string): Promise<void> {
    const peer = this.peers.find((p) => p.userId === peerId);
    if (!peer) {
      throw new Error("Recipient is not nearby.");
    }

    if (!this.identity) {
      throw new Error("Identity not initialized.");
    }

    // Simulate sending latency
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Simulate a friendly auto-reply after 2.5 seconds to test incoming message UX
    if (this.autoReplyTimeout) {
      clearTimeout(this.autoReplyTimeout);
    }

    this.autoReplyTimeout = setTimeout(() => {
      const replyPacket = createMessagePacket({
        senderId: peer.userId,
        senderName: peer.displayName,
        receiverId: this.identity?.userId || 'YOU',
        text: `Hey ${this.identity?.displayName || 'there'}! Received: "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`,
      });
      this.notifyMessage(replyPacket);
    }, 2200);
  }

  // Developer simulation helper for testing incoming message modal directly
  simulateIncomingMessage(senderName = 'Jordan', text = 'Hello from nearby!'): void {
    const packet = createMessagePacket({
      senderId: 'MOCK_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      senderName,
      receiverId: this.identity?.userId || 'USER',
      text,
    });
    this.notifyMessage(packet);
  }

  onPeersChanged(callback: (peers: Peer[]) => void): () => void {
    this.peerListeners.add(callback);
    callback(this.peers);
    return () => {
      this.peerListeners.delete(callback);
    };
  }

  onMessage(callback: (packet: MessagePacket) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  onStatusChanged(callback: (status: TransportStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  getStatus(): TransportStatus {
    return this.status;
  }

  private setStatus(status: TransportStatus): void {
    this.status = status;
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('Status listener error:', err);
      }
    });
  }

  private updatePeerState(peerId: string, state: Peer['state']): void {
    this.peers = this.peers.map((p) => (p.userId === peerId ? { ...p, state } : p));
    this.notifyPeers(this.peers);
  }

  private notifyPeers(peers: Peer[]): void {
    this.peerListeners.forEach((cb) => {
      try {
        cb(peers);
      } catch (err) {
        console.error('Peer listener error:', err);
      }
    });
  }

  private notifyMessage(packet: MessagePacket): void {
    this.messageListeners.forEach((cb) => {
      try {
        cb(packet);
      } catch (err) {
        console.error('Message listener error:', err);
      }
    });
  }
}
