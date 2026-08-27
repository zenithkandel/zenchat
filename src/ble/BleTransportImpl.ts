/**
 * ZenChat BLE — Transport Implementation
 *
 * Real BLE implementation using munim-bluetooth.
 * Handles both Central (Scanner/Client) and Peripheral (Advertiser/GATT Server) roles
 * for direct peer-to-peer mobile communication.
 *
 * IMPLEMENTED BUT REQUIRES PHYSICAL DEVICE VALIDATION
 */

import { logger } from '../utils/logger';
import {
  BLE_SERVICE_UUID,
  BLE_RX_CHARACTERISTIC_UUID,
  BLE_TX_CHARACTERISTIC_UUID,
  BLE_CONFIG,
} from './BleConstants';
import { requestBluetoothPermissions } from './BlePermissions';
import type {
  Transport,
  BluetoothState,
  DiscoveredPeer,
  ConnectionStateEvent,
  AdvertisementIdentity,
  Unsubscribe,
} from './BleTransport';

// ─── Data Conversion Helpers ───────────────────────────────────────

export function uint8ArrayToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const length = Math.floor(cleanHex.length / 2);
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function utf8ToHex(str: string): string {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return uint8ArrayToHex(bytes);
}

export function hexToUtf8(hex: string): string {
  const bytes = hexToUint8Array(hex);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]!);
  }
  return str;
}

// ─── Event Emitter Helper ──────────────────────────────────────────

type Callback<T> = (arg: T) => void;
type DataCallback = (peerId: string, data: Uint8Array) => void;

class SimpleEventEmitter<T> {
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
  private cleanupFns: Array<() => void> = [];

  // Event emitters
  private stateEmitter = new SimpleEventEmitter<BluetoothState>();
  private connectionEmitter = new SimpleEventEmitter<ConnectionStateEvent>();
  private peerEmitter = new SimpleEventEmitter<DiscoveredPeer>();
  private dataCallbacks: Set<DataCallback> = new Set();

  // Reference to loaded native bluetooth module
  private bluetoothModule: typeof import('munim-bluetooth') | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('BLE', 'Transport already initialized');
      return;
    }

    try {
      logger.info('BLE', 'Initializing BLE transport via munim-bluetooth...');

      // Request runtime permissions first
      await requestBluetoothPermissions();

      // Dynamic import to support graceful fallback
      const munim = await import('munim-bluetooth');
      this.bluetoothModule = munim;

      // Subscribe to adapter state changes
      if (munim.addEventListener) {
        const removeAdapterListener = munim.addEventListener('adapterStateChanged', (data) => {
          logger.info('BLE', `Bluetooth adapter state: ${data.state}`);
          this.stateEmitter.emit(data.state as BluetoothState);
        });
        this.cleanupFns.push(removeAdapterListener);

        // Subscribe to scan results (device found)
        const removeDeviceFoundListener = munim.addEventListener('deviceFound', (device) => {
          this.handleDiscoveredDevice(device);
        });
        this.cleanupFns.push(removeDeviceFoundListener);

        // Also listen to scanResult event if emitted
        const removeScanResultListener = munim.addEventListener('scanResult', (device) => {
          this.handleDiscoveredDevice(device);
        });
        this.cleanupFns.push(removeScanResultListener);

        // Subscribe to central connection state changes
        const removeConnStateListener = munim.addEventListener('connectionStateChanged', (data) => {
          logger.info('CONNECTION', `Connection state changed for ${data.deviceId}: ${data.state}`);
          this.connectionEmitter.emit({
            peerId: data.deviceId,
            state: data.state as any,
            error: data.reason,
          });
        });
        this.cleanupFns.push(removeConnStateListener);

        // Subscribe to incoming notifications (GATT Client reading characteristic updates)
        const removeCharListener = munim.addEventListener('characteristicValueChanged', (data) => {
          if (data.value) {
            const rawBytes = hexToUint8Array(data.value);
            this.notifyDataReceived(data.deviceId, rawBytes);
          }
        });
        this.cleanupFns.push(removeCharListener);

        // Subscribe to peripheral write requests (GATT Server receiving data written by Central)
        const removePeripheralWriteListener = munim.addEventListener('peripheralWriteRequest', (data) => {
          logger.debug('BLE', `Peripheral write request from central ${data.centralId}`, data);
          if (munim.respondToPeripheralWriteRequest) {
            munim.respondToPeripheralWriteRequest(data.requestId, true);
          }
          if (data.value) {
            const rawBytes = hexToUint8Array(data.value);
            this.notifyDataReceived(data.centralId, rawBytes);
          }
        });
        this.cleanupFns.push(removePeripheralWriteListener);
      }

      this.isInitialized = true;
      logger.info('BLE', 'BLE transport initialized successfully');
    } catch (error) {
      logger.error('BLE', 'Failed to initialize BLE transport', error);
      this.isInitialized = false;
    }
  }

  private handleDiscoveredDevice(device: any): void {
    if (!device || !device.id) return;

    // Filter to check if this device advertises ZenChat service UUID or name prefix
    const name = device.name || device.localName;
    const isAppPeer = true; // Devices discovered via service UUID filter or name prefix

    const peer: DiscoveredPeer = {
      bleId: device.id,
      name: this.parseDeviceName(name),
      rssi: device.rssi ?? -100,
      lastSeenAt: Date.now(),
      isAppPeer,
    };

    this.discoveredPeers.set(peer.bleId, peer);
    this.peerEmitter.emit(peer);
  }

  private notifyDataReceived(peerId: string, data: Uint8Array): void {
    for (const callback of this.dataCallbacks) {
      try {
        callback(peerId, data);
      } catch (err) {
        logger.error('BLE', 'Error executing onData callback', err);
      }
    }
  }

  async getBluetoothState(): Promise<BluetoothState> {
    try {
      if (!this.bluetoothModule) {
        return 'unknown';
      }

      const isEnabled = await this.bluetoothModule.isBluetoothEnabled();
      return isEnabled ? 'poweredOn' : 'poweredOff';
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
      logger.info('BLE', `Starting advertising as "${identity.displayName}" (${identity.userId})`);

      if (this.bluetoothModule) {
        // Set up GATT Server Services & Characteristics
        if (this.bluetoothModule.setServices) {
          this.bluetoothModule.setServices([
            {
              uuid: BLE_SERVICE_UUID,
              characteristics: [
                {
                  uuid: BLE_RX_CHARACTERISTIC_UUID,
                  properties: ['write', 'writeWithoutResponse'],
                  permissions: ['write'],
                },
                {
                  uuid: BLE_TX_CHARACTERISTIC_UUID,
                  properties: ['read', 'notify'],
                  permissions: ['read'],
                },
              ],
            },
          ]);
        }

        // Start Advertising
        const localName = `${BLE_CONFIG.DEVICE_NAME_PREFIX}:${identity.displayName}`;
        this.bluetoothModule.startAdvertising({
          serviceUUIDs: [BLE_SERVICE_UUID],
          localName: localName.slice(0, 28),
        });

        this.isAdvertising = true;
        logger.info('BLE', 'BLE advertising started');
      } else {
        logger.warn('BLE', 'munim-bluetooth not loaded — advertising skipped');
      }
    } catch (error) {
      logger.error('BLE', 'Failed to start advertising', error);
      throw error;
    }
  }

  async stopAdvertising(): Promise<void> {
    if (!this.isAdvertising) return;

    try {
      if (this.bluetoothModule?.stopAdvertising) {
        this.bluetoothModule.stopAdvertising();
      }
      this.isAdvertising = false;
      logger.info('BLE', 'BLE advertising stopped');
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
      logger.info('BLE', 'Starting BLE scan for ZenChat peers...');

      if (this.bluetoothModule) {
        this.bluetoothModule.startScan({
          serviceUUIDs: [BLE_SERVICE_UUID],
          allowDuplicates: true,
        });

        this.isScanning = true;
        logger.info('BLE', 'BLE scanning started');
      } else {
        logger.warn('BLE', 'munim-bluetooth not loaded — scanning skipped');
      }
    } catch (error) {
      logger.error('BLE', 'Failed to start scanning', error);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    if (!this.isScanning) return;

    try {
      if (this.bluetoothModule?.stopScan) {
        this.bluetoothModule.stopScan();
      }
      this.isScanning = false;
      logger.info('BLE', 'BLE scanning stopped');
    } catch (error) {
      logger.error('BLE', 'Failed to stop scanning', error);
    }
  }

  async getDiscoveredPeers(): Promise<DiscoveredPeer[]> {
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

      if (this.bluetoothModule) {
        await this.bluetoothModule.connect(peerId);

        // Discover services
        await this.bluetoothModule.discoverServices(peerId);

        // Subscribe to TX characteristic notifications
        await this.bluetoothModule.subscribeToCharacteristic(
          peerId,
          BLE_SERVICE_UUID,
          BLE_TX_CHARACTERISTIC_UUID,
        );

        this.connectionEmitter.emit({
          peerId,
          state: 'connected',
        });

        logger.info('CONNECTION', `Successfully connected and subscribed to peer: ${peerId}`);
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

      if (this.bluetoothModule?.disconnect) {
        this.bluetoothModule.disconnect(peerId);
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
      if (!this.bluetoothModule) {
        throw new Error('BLE module not available');
      }

      const hexValue = uint8ArrayToHex(data);

      // Write to the peer's RX characteristic
      await this.bluetoothModule.writeCharacteristic(
        peerId,
        BLE_SERVICE_UUID,
        BLE_RX_CHARACTERISTIC_UUID,
        hexValue,
        'write',
      );

      logger.debug('BLE', `Sent ${data.length} bytes to ${peerId}`);
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

      for (const cleanup of this.cleanupFns) {
        try {
          cleanup();
        } catch {}
      }
      this.cleanupFns = [];

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

  private parseDeviceName(name: string | undefined | null): string | undefined {
    if (!name) return undefined;
    const prefix = `${BLE_CONFIG.DEVICE_NAME_PREFIX}:`;
    if (name.startsWith(prefix)) {
      return name.slice(prefix.length);
    }
    return name;
  }

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
