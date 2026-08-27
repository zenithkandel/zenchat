/**
 * ZenChat BLE — Transport Implementation
 *
 * Real BLE implementation using munim-bluetooth.
 * Handles both Central and Peripheral roles for peer-to-peer communication.
 *
 * IMPLEMENTED BUT REQUIRES PHYSICAL DEVICE VALIDATION
 */

import { Platform } from 'react-native';
import { logger } from '../utils/logger';
import {
  BLE_SERVICE_UUID,
  BLE_RX_CHARACTERISTIC_UUID,
  BLE_TX_CHARACTERISTIC_UUID,
  BLE_CONFIG,
} from './BleConstants';
import type {
  Transport,
  BluetoothState,
  DiscoveredPeer,
  ConnectionStateEvent,
  AdvertisementIdentity,
  Unsubscribe,
} from './BleTransport';

// ─── Event Emitter Helper ──────────────────────────────────────────

type Callback<T> = (arg: T) => void;
type DataCallback = (peerId: string, data: Uint8Array) => void;

class EventEmitter<T> {
  private listeners: Set<Callback<T>> = new Set();

  subscribe(callback: Callback<T>): Unsubscribe {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit(value: T): void {
    for (const listener of this.listeners) {
      try {
        listener(value);
      } catch (e) {
        logger.error('BLE', 'Event listener error', e);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

// ─── BLE Transport Implementation ─────────────────────────────────

export class BleTransportImpl implements Transport {
  private isInitialized = false;
  private isAdvertising = false;
  private isScanning = false;

  private discoveredPeers: Map<string, DiscoveredPeer> = new Map();

  // Event emitters
  private dataEmitter = new EventEmitter<{ peerId: string; data: Uint8Array }>();
  private stateEmitter = new EventEmitter<BluetoothState>();
  private connectionEmitter = new EventEmitter<ConnectionStateEvent>();
  private peerEmitter = new EventEmitter<DiscoveredPeer>();
  private dataCallbacks: Set<DataCallback> = new Set();

  // munim-bluetooth references
  private bleManager: any = null;
  private peripheralManager: any = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('BLE', 'Transport already initialized');
      return;
    }

    try {
      logger.info('BLE', 'Initializing BLE transport...');

      // Dynamic import to handle the case where munim-bluetooth may not be available
      const bluetooth = await import('munim-bluetooth');

      // Initialize central manager (for scanning and connecting)
      if (bluetooth.BleManager) {
        this.bleManager = new bluetooth.BleManager();
      }

      // Initialize peripheral manager (for advertising)
      if (bluetooth.PeripheralManager) {
        this.peripheralManager = new bluetooth.PeripheralManager();
      }

      this.isInitialized = true;
      logger.info('BLE', 'BLE transport initialized successfully');
    } catch (error) {
      logger.error('BLE', 'Failed to initialize BLE transport', error);
      // Don't throw — the app should still function without BLE
      // The UI will show appropriate state
      this.isInitialized = false;
    }
  }

  async getBluetoothState(): Promise<BluetoothState> {
    try {
      if (!this.bleManager) {
        return 'unknown';
      }

      const state = await this.bleManager.state();

      // Map munim-bluetooth states to our BluetoothState type
      const stateMap: Record<string, BluetoothState> = {
        'PoweredOn': 'poweredOn',
        'PoweredOff': 'poweredOff',
        'Unauthorized': 'unauthorized',
        'Unsupported': 'unsupported',
        'Resetting': 'resetting',
        'Unknown': 'unknown',
      };

      return stateMap[state] ?? 'unknown';
    } catch (error) {
      logger.error('BLE', 'Failed to get Bluetooth state', error);
      return 'unknown';
    }
  }

  async startAdvertising(identity: AdvertisementIdentity): Promise<void> {
    if (this.isAdvertising) {
      logger.warn('BLE', 'Already advertising');
      return;
    }

    try {
      logger.info('BLE', `Starting advertising as "${identity.displayName}"`);

      if (this.peripheralManager) {
        // Set up GATT server with our service
        await this.peripheralManager.addService({
          uuid: BLE_SERVICE_UUID,
          primary: true,
          characteristics: [
            {
              uuid: BLE_RX_CHARACTERISTIC_UUID,
              properties: ['write', 'writeWithoutResponse'],
              permissions: ['writeable'],
            },
            {
              uuid: BLE_TX_CHARACTERISTIC_UUID,
              properties: ['read', 'notify'],
              permissions: ['readable'],
            },
          ],
        });

        // Start advertising with our service UUID and local name
        const localName = `${BLE_CONFIG.DEVICE_NAME_PREFIX}:${identity.displayName}`;
        await this.peripheralManager.startAdvertising({
          localName: localName.slice(0, 28), // BLE advertising name length limit
          serviceUUIDs: [BLE_SERVICE_UUID],
        });

        this.isAdvertising = true;
        logger.info('BLE', 'Advertising started');
      } else {
        logger.warn('BLE', 'Peripheral manager not available — cannot advertise');
      }
    } catch (error) {
      logger.error('BLE', 'Failed to start advertising', error);
      throw error;
    }
  }

  async stopAdvertising(): Promise<void> {
    if (!this.isAdvertising) return;

    try {
      if (this.peripheralManager) {
        await this.peripheralManager.stopAdvertising();
      }
      this.isAdvertising = false;
      logger.info('BLE', 'Advertising stopped');
    } catch (error) {
      logger.error('BLE', 'Failed to stop advertising', error);
    }
  }

  async startScanning(): Promise<void> {
    if (this.isScanning) {
      logger.warn('BLE', 'Already scanning');
      return;
    }

    try {
      logger.info('BLE', 'Starting BLE scan...');

      if (this.bleManager) {
        // Scan for our specific service UUID to filter non-app devices
        await this.bleManager.startDeviceScan(
          [BLE_SERVICE_UUID],
          { allowDuplicates: true },
          (error: any, device: any) => {
            if (error) {
              logger.error('DISCOVERY', 'Scan error', error);
              return;
            }

            if (device) {
              const peer: DiscoveredPeer = {
                bleId: device.id,
                name: this.parseDeviceName(device.localName || device.name),
                rssi: device.rssi ?? -100,
                lastSeenAt: Date.now(),
                isAppPeer: true, // Filtered by service UUID
              };

              this.discoveredPeers.set(peer.bleId, peer);
              this.peerEmitter.emit(peer);
            }
          },
        );

        this.isScanning = true;
        logger.info('BLE', 'Scanning started');
      } else {
        logger.warn('BLE', 'BLE manager not available — cannot scan');
      }
    } catch (error) {
      logger.error('BLE', 'Failed to start scanning', error);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    if (!this.isScanning) return;

    try {
      if (this.bleManager) {
        await this.bleManager.stopDeviceScan();
      }
      this.isScanning = false;
      logger.info('BLE', 'Scanning stopped');
    } catch (error) {
      logger.error('BLE', 'Failed to stop scanning', error);
    }
  }

  async getDiscoveredPeers(): Promise<DiscoveredPeer[]> {
    // Clean stale peers (not seen in last 30 seconds)
    const staleThreshold = Date.now() - 30000;
    for (const [id, peer] of this.discoveredPeers) {
      if (peer.lastSeenAt < staleThreshold) {
        this.discoveredPeers.delete(id);
      }
    }

    return Array.from(this.discoveredPeers.values());
  }

  async connect(peerId: string): Promise<void> {
    try {
      logger.info('CONNECTION', `Connecting to peer: ${peerId}`);

      this.connectionEmitter.emit({
        peerId,
        state: 'connecting',
      });

      if (this.bleManager) {
        const device = await this.bleManager.connectToDevice(peerId, {
          timeout: 10000,
        });

        // Discover services and characteristics
        await device.discoverAllServicesAndCharacteristics();

        // Set up notification subscription for receiving data
        device.monitorCharacteristicForService(
          BLE_SERVICE_UUID,
          BLE_TX_CHARACTERISTIC_UUID,
          (error: any, characteristic: any) => {
            if (error) {
              logger.error('CONNECTION', 'Notification error', error);
              return;
            }

            if (characteristic?.value) {
              // Decode base64 to Uint8Array
              const decoded = this.base64ToUint8Array(characteristic.value);
              for (const cb of this.dataCallbacks) {
                try {
                  cb(peerId, decoded);
                } catch (e) {
                  logger.error('BLE', 'Data callback error', e);
                }
              }
            }
          },
        );

        // Monitor disconnection
        device.onDisconnected((error: any, disconnectedDevice: any) => {
          logger.info('CONNECTION', `Peer disconnected: ${peerId}`);
          this.connectionEmitter.emit({
            peerId,
            state: 'disconnected',
            error: error?.message,
          });
        });

        this.connectionEmitter.emit({
          peerId,
          state: 'connected',
        });

        logger.info('CONNECTION', `Connected to peer: ${peerId}`);
      }
    } catch (error) {
      logger.error('CONNECTION', `Failed to connect to peer: ${peerId}`, error);
      this.connectionEmitter.emit({
        peerId,
        state: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async disconnect(peerId: string): Promise<void> {
    try {
      logger.info('CONNECTION', `Disconnecting from peer: ${peerId}`);

      this.connectionEmitter.emit({
        peerId,
        state: 'disconnecting',
      });

      if (this.bleManager) {
        await this.bleManager.cancelDeviceConnection(peerId);
      }

      this.connectionEmitter.emit({
        peerId,
        state: 'disconnected',
      });

      logger.info('CONNECTION', `Disconnected from peer: ${peerId}`);
    } catch (error) {
      logger.error('CONNECTION', `Failed to disconnect from peer: ${peerId}`, error);
    }
  }

  async send(peerId: string, data: Uint8Array): Promise<void> {
    try {
      if (!this.bleManager) {
        throw new Error('BLE manager not available');
      }

      // Encode to base64 for BLE characteristic write
      const base64Data = this.uint8ArrayToBase64(data);

      await this.bleManager.writeCharacteristicWithResponseForDevice(
        peerId,
        BLE_SERVICE_UUID,
        BLE_RX_CHARACTERISTIC_UUID,
        base64Data,
      );
    } catch (error) {
      logger.error('BLE', `Failed to send data to peer: ${peerId}`, error);
      throw error;
    }
  }

  onData(callback: DataCallback): Unsubscribe {
    this.dataCallbacks.add(callback);
    return () => {
      this.dataCallbacks.delete(callback);
    };
  }

  onBluetoothStateChange(callback: (state: BluetoothState) => void): Unsubscribe {
    return this.stateEmitter.subscribe(callback);
  }

  onConnectionStateChange(callback: (event: ConnectionStateEvent) => void): Unsubscribe {
    return this.connectionEmitter.subscribe(callback);
  }

  onPeerDiscovered(callback: (peer: DiscoveredPeer) => void): Unsubscribe {
    return this.peerEmitter.subscribe(callback);
  }

  async destroy(): Promise<void> {
    try {
      await this.stopScanning();
      await this.stopAdvertising();

      if (this.bleManager) {
        await this.bleManager.destroy();
        this.bleManager = null;
      }

      this.peripheralManager = null;
      this.discoveredPeers.clear();
      this.dataCallbacks.clear();
      this.stateEmitter.clear();
      this.connectionEmitter.clear();
      this.peerEmitter.clear();
      this.isInitialized = false;

      logger.info('BLE', 'BLE transport destroyed');
    } catch (error) {
      logger.error('BLE', 'Error destroying BLE transport', error);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────

  /**
   * Parse the display name from a BLE device name.
   * Our format: "ZenChat:DisplayName"
   */
  private parseDeviceName(name: string | undefined | null): string | undefined {
    if (!name) return undefined;
    const prefix = `${BLE_CONFIG.DEVICE_NAME_PREFIX}:`;
    if (name.startsWith(prefix)) {
      return name.slice(prefix.length);
    }
    return name;
  }

  /**
   * Convert Uint8Array to base64 string.
   */
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to Uint8Array.
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // ─── Status Getters ────────────────────────────────────────────

  get initialized(): boolean {
    return this.isInitialized;
  }

  get advertising(): boolean {
    return this.isAdvertising;
  }

  get scanning(): boolean {
    return this.isScanning;
  }
}

/** Singleton transport instance */
export const bleTransport = new BleTransportImpl();
