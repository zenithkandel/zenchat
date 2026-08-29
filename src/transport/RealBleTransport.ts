import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { MessageTransport, Peer, TransportStatus } from './MessageTransport';
import {
  MessagePacket,
  createMessagePacket,
  parseAndValidatePacket,
  serializePacket,
} from '../protocol/MessagePacket';
import { UserIdentity } from '../identity/IdentityService';

const { ZenChatBle } = NativeModules;

export type BleDiscoveredEvent = {
  userId: string;
  displayName: string;
  deviceAddress: string;
  rssi: number;
};

export type BleMessageEvent = {
  rawPacket: string;
  deviceAddress?: string;
};

/**
 * RealBleTransport provides genuine hardware Bluetooth Low Energy peer discovery
 * and direct 1-to-1 message transmission on standalone Android/iOS builds.
 */
export class RealBleTransport implements MessageTransport {
  readonly isMock = false;
  private identity: UserIdentity | null = null;
  private status: TransportStatus = 'ready';

  private discoveredPeers: Map<string, Peer> = new Map();
  private peerAddresses: Map<string, string> = new Map(); // userId -> MAC Address

  private peerListeners: Set<(peers: Peer[]) => void> = new Set();
  private messageListeners: Set<(packet: MessagePacket) => void> = new Set();
  private statusListeners: Set<(status: TransportStatus) => void> = new Set();

  private eventEmitter: NativeEventEmitter | null = null;
  private peerSubscription: any = null;
  private messageSubscription: any = null;
  private errorSubscription: any = null;

  constructor() {
    if (ZenChatBle) {
      this.eventEmitter = new NativeEventEmitter(ZenChatBle);
    }
  }

  async start(identity: UserIdentity): Promise<void> {
    this.identity = identity;
    this.discoveredPeers.clear();
    this.peerAddresses.clear();

    if (!ZenChatBle) {
      console.warn('[RealBleTransport] Native ZenChatBle module is not linked in this build.');
      this.setStatus('error');
      return;
    }

    try {
      const state = await ZenChatBle.getBluetoothState();
      if (state === 'OFF') {
        this.setStatus('bluetooth_off');
        return;
      }

      this.setStatus('ready');
      this.setupNativeListeners();

      // Start Peripheral Advertising
      await ZenChatBle.startAdvertising(identity.userId, identity.displayName);

      // Start Central Scanning
      await ZenChatBle.startScan();
      this.setStatus('searching');
    } catch (err: any) {
      console.warn('[RealBleTransport] Failed to start native BLE:', err);
      this.setStatus('error');
    }
  }

  async stop(): Promise<void> {
    this.removeNativeListeners();
    if (ZenChatBle) {
      try {
        await ZenChatBle.stopAdvertising();
        await ZenChatBle.stopScan();
      } catch {}
    }
    this.discoveredPeers.clear();
    this.peerAddresses.clear();
    this.notifyPeers([]);
    this.setStatus('ready');
  }

  async discoverPeers(): Promise<Peer[]> {
    if (!ZenChatBle) return [];

    try {
      this.setStatus('searching');
      await ZenChatBle.stopScan();
      await ZenChatBle.startScan();

      // Reset searching indicator after 2.5 seconds of active discovery
      setTimeout(() => {
        if (this.status === 'searching') {
          this.setStatus('ready');
        }
      }, 2500);

      return Array.from(this.discoveredPeers.values());
    } catch (err) {
      console.warn('[RealBleTransport] Discovery scan error:', err);
      this.setStatus('error');
      return [];
    }
  }

  async connect(peerId: string): Promise<void> {
    const peer = this.discoveredPeers.get(peerId);
    if (!peer) {
      throw new Error('Peer is no longer in Bluetooth range.');
    }
    this.updatePeerState(peerId, 'connecting');
    // Direct BLE connects during GATT characteristic write
    this.updatePeerState(peerId, 'connected');
  }

  async sendMessage(peerId: string, text: string): Promise<void> {
    if (!ZenChatBle) {
      throw new Error('Native Bluetooth module not available.');
    }

    if (!this.identity) {
      throw new Error('Identity not initialized.');
    }

    const deviceAddress = this.peerAddresses.get(peerId);
    if (!deviceAddress) {
      throw new Error('Device Bluetooth address not found. Scan again.');
    }

    const peer = this.discoveredPeers.get(peerId);
    const packet = createMessagePacket({
      senderId: this.identity.userId,
      senderName: this.identity.displayName,
      receiverId: peerId,
      text,
    });

    const serialized = serializePacket(packet);

    try {
      this.updatePeerState(peerId, 'connecting');
      await ZenChatBle.sendMessage(deviceAddress, serialized);
      this.updatePeerState(peerId, 'connected');
    } catch (err: any) {
      this.updatePeerState(peerId, 'nearby');
      throw new Error(err?.message || "Couldn't send message to nearby device.");
    }
  }

  onPeersChanged(callback: (peers: Peer[]) => void): () => void {
    this.peerListeners.add(callback);
    callback(Array.from(this.discoveredPeers.values()));
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

  private setupNativeListeners(): void {
    if (!this.eventEmitter) return;
    this.removeNativeListeners();

    // 1. Peer Discovered Event from native BLE Scanner
    this.peerSubscription = this.eventEmitter.addListener(
      'onPeerDiscovered',
      (event: BleDiscoveredEvent) => {
        if (!event || !event.userId) return;

        // Ignore our own broadcast
        if (this.identity && event.userId === this.identity.userId) return;

        this.peerAddresses.set(event.userId, event.deviceAddress);

        const peer: Peer = {
          userId: event.userId,
          displayName: event.displayName || 'Unknown Peer',
          state: 'nearby',
        };

        this.discoveredPeers.set(event.userId, peer);
        this.notifyPeers(Array.from(this.discoveredPeers.values()));
      }
    );

    // 2. Incoming Message Event from native BLE GATT Server
    this.messageSubscription = this.eventEmitter.addListener(
      'onMessageReceived',
      (event: BleMessageEvent) => {
        if (!event || !event.rawPacket) return;

        const packet = parseAndValidatePacket(event.rawPacket);
        if (!packet) return;

        // Verify message was directed to this device
        if (this.identity && packet.receiverId !== this.identity.userId) {
          return;
        }

        this.notifyMessage(packet);
      }
    );

    // 3. BLE Error Event
    this.errorSubscription = this.eventEmitter.addListener(
      'onBleError',
      (err: any) => {
        console.warn('[RealBleTransport] Native BLE warning:', err);
      }
    );
  }

  private removeNativeListeners(): void {
    if (this.peerSubscription) {
      this.peerSubscription.remove();
      this.peerSubscription = null;
    }
    if (this.messageSubscription) {
      this.messageSubscription.remove();
      this.messageSubscription = null;
    }
    if (this.errorSubscription) {
      this.errorSubscription.remove();
      this.errorSubscription = null;
    }
  }

  private setStatus(status: TransportStatus): void {
    this.status = status;
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('Status callback error:', err);
      }
    });
  }

  private updatePeerState(peerId: string, state: Peer['state']): void {
    const peer = this.discoveredPeers.get(peerId);
    if (peer) {
      peer.state = state;
      this.notifyPeers(Array.from(this.discoveredPeers.values()));
    }
  }

  private notifyPeers(peers: Peer[]): void {
    this.peerListeners.forEach((cb) => {
      try {
        cb(peers);
      } catch (err) {
        console.error('Peers callback error:', err);
      }
    });
  }

  private notifyMessage(packet: MessagePacket): void {
    this.messageListeners.forEach((cb) => {
      try {
        cb(packet);
      } catch (err) {
        console.error('Message callback error:', err);
      }
    });
  }
}
