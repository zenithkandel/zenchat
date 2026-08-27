/**
 * ZenChat BLE — Constants
 *
 * Centralized protocol constants.
 * DO NOT hardcode UUID strings elsewhere in the codebase.
 */

/**
 * Application-specific BLE Service UUID.
 * Used to filter only ZenChat devices during scanning.
 * Generated randomly for this application.
 */
export const BLE_SERVICE_UUID = '8C2D4F6E-A1B3-4E5F-9D7C-2B8A0F3E6D9C';

/**
 * Characteristic for receiving data (RX from peripheral's perspective).
 * Central writes to this characteristic to send data to the peripheral.
 */
export const BLE_RX_CHARACTERISTIC_UUID = '8C2D4F6E-A1B3-4E5F-9D7C-2B8A0F3E6D9D';

/**
 * Characteristic for transmitting data (TX from peripheral's perspective).
 * Central subscribes to notifications on this characteristic to receive data.
 */
export const BLE_TX_CHARACTERISTIC_UUID = '8C2D4F6E-A1B3-4E5F-9D7C-2B8A0F3E6D9E';

/**
 * Characteristic for control signals (connection state, handshake control).
 */
export const BLE_CONTROL_CHARACTERISTIC_UUID = '8C2D4F6E-A1B3-4E5F-9D7C-2B8A0F3E6D9F';

/**
 * BLE connection timeouts (in milliseconds).
 */
export const BLE_TIMEOUTS = {
  /** Time to wait for a connection to establish */
  CONNECT: 10000,
  /** Time to wait for service discovery */
  SERVICE_DISCOVERY: 5000,
  /** Time to wait for handshake completion */
  HANDSHAKE: 15000,
  /** Time to wait for a packet acknowledgement */
  PACKET_ACK: 5000,
  /** Time to wait before reconnection attempt */
  RECONNECT_BASE: 2000,
  /** Maximum reconnection delay */
  RECONNECT_MAX: 30000,
  /** Scan interval */
  SCAN_INTERVAL: 3000,
} as const;

/**
 * BLE connection retry configuration.
 */
export const BLE_RETRY = {
  /** Maximum number of connection retries */
  MAX_CONNECT_RETRIES: 3,
  /** Maximum number of packet send retries */
  MAX_SEND_RETRIES: 3,
  /** Backoff multiplier */
  BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * BLE transport configuration.
 */
export const BLE_CONFIG = {
  /** Maximum payload size per characteristic write (conservative) */
  MAX_CHUNK_SIZE: 512,
  /** Maximum total packet size before rejection */
  MAX_PACKET_SIZE: 65536,
  /** Device name prefix for advertising */
  DEVICE_NAME_PREFIX: 'ZenChat',
} as const;
