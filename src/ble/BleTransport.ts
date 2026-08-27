/**
 * ZenChat BLE — Transport Abstraction
 *
 * Clean interface that hides BLE implementation details.
 * The rest of the app never touches BLE primitives directly.
 *
 * Future transports (Wi-Fi Direct, etc.) can implement this same interface.
 */

// ─── Types ─────────────────────────────────────────────────────────

export type BluetoothState =
  | 'unknown'
  | 'resetting'
  | 'unsupported'
  | 'unauthorized'
  | 'poweredOff'
  | 'poweredOn';

export type ConnectionState =
  | 'disconnected'
  | 'discovering'
  | 'connecting'
  | 'connected'
  | 'handshaking'
  | 'ready'
  | 'disconnecting'
  | 'error';

export interface DiscoveredPeer {
  /** Unique BLE identifier for this scan result */
  bleId: string;
  /** Display name from advertisement (if available) */
  name?: string;
  /** Signal strength indicator */
  rssi: number;
  /** When this peer was last seen */
  lastSeenAt: number;
  /** Whether this peer is running our app (has our service UUID) */
  isAppPeer: boolean;
}

export interface TransportPacket {
  /** Raw data bytes */
  data: Uint8Array;
}

export interface ConnectionStateEvent {
  peerId: string;
  state: ConnectionState;
  error?: string;
}

export type Unsubscribe = () => void;

export interface AdvertisementIdentity {
  displayName: string;
  userId: string;
}

// ─── Transport Interface ───────────────────────────────────────────

export interface Transport {
  /**
   * Initialize the transport layer.
   * Must be called before any other operation.
   */
  initialize(): Promise<void>;

  /**
   * Get the current Bluetooth state.
   */
  getBluetoothState(): Promise<BluetoothState>;

  /**
   * Start advertising this device as a ZenChat peripheral.
   */
  startAdvertising(identity: AdvertisementIdentity): Promise<void>;

  /**
   * Stop advertising.
   */
  stopAdvertising(): Promise<void>;

  /**
   * Start scanning for nearby ZenChat devices.
   */
  startScanning(): Promise<void>;

  /**
   * Stop scanning.
   */
  stopScanning(): Promise<void>;

  /**
   * Get the current list of discovered peers.
   */
  getDiscoveredPeers(): Promise<DiscoveredPeer[]>;

  /**
   * Connect to a specific peer.
   */
  connect(peerId: string): Promise<void>;

  /**
   * Disconnect from a specific peer.
   */
  disconnect(peerId: string): Promise<void>;

  /**
   * Send data to a connected peer.
   */
  send(peerId: string, data: Uint8Array): Promise<void>;

  /**
   * Subscribe to incoming data from any connected peer.
   */
  onData(callback: (peerId: string, data: Uint8Array) => void): Unsubscribe;

  /**
   * Subscribe to Bluetooth state changes.
   */
  onBluetoothStateChange(callback: (state: BluetoothState) => void): Unsubscribe;

  /**
   * Subscribe to connection state changes.
   */
  onConnectionStateChange(callback: (event: ConnectionStateEvent) => void): Unsubscribe;

  /**
   * Subscribe to peer discovery events.
   */
  onPeerDiscovered(callback: (peer: DiscoveredPeer) => void): Unsubscribe;

  /**
   * Tear down the transport layer.
   */
  destroy(): Promise<void>;
}
