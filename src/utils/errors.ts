/**
 * ZenChat — Structured Error Types
 *
 * Every service returns structured errors with human-friendly messages.
 */

export interface AppError {
  /** Machine-readable error code */
  code: string;
  /** Technical error message for logging */
  message: string;
  /** Human-friendly message for UI display */
  userMessage: string;
  /** Whether the operation can be retried */
  retryable: boolean;
}

// ─── Error Codes ───────────────────────────────────────────────────

export const AppErrorCodes = {
  // Bluetooth
  BLUETOOTH_DISABLED: 'BLUETOOTH_DISABLED',
  BLUETOOTH_PERMISSION_DENIED: 'BLUETOOTH_PERMISSION_DENIED',
  BLE_NOT_SUPPORTED: 'BLE_NOT_SUPPORTED',

  // Connection
  PEER_NOT_FOUND: 'PEER_NOT_FOUND',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  CHARACTERISTIC_NOT_FOUND: 'CHARACTERISTIC_NOT_FOUND',

  // Transport
  WRITE_FAILED: 'WRITE_FAILED',
  READ_FAILED: 'READ_FAILED',
  NOTIFY_FAILED: 'NOTIFY_FAILED',

  // Protocol
  PACKET_INVALID: 'PACKET_INVALID',
  PACKET_TOO_LARGE: 'PACKET_TOO_LARGE',
  PACKET_TIMEOUT: 'PACKET_TIMEOUT',
  PEER_REJECTED: 'PEER_REJECTED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  VERSION_MISMATCH: 'VERSION_MISMATCH',

  // Identity
  IDENTITY_NOT_FOUND: 'IDENTITY_NOT_FOUND',
  QR_INVALID: 'QR_INVALID',
  QR_SELF_SCAN: 'QR_SELF_SCAN',

  // Storage
  DATABASE_ERROR: 'DATABASE_ERROR',
  STORAGE_FULL: 'STORAGE_FULL',

  // General
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// ─── Human-Friendly Error Messages ────────────────────────────────

const USER_MESSAGES: Record<string, string> = {
  [AppErrorCodes.BLUETOOTH_DISABLED]: 'Bluetooth is turned off. Please enable it in your device settings.',
  [AppErrorCodes.BLUETOOTH_PERMISSION_DENIED]: 'Bluetooth permission is required to find and connect with nearby people.',
  [AppErrorCodes.BLE_NOT_SUPPORTED]: 'This device does not support Bluetooth Low Energy.',
  [AppErrorCodes.PEER_NOT_FOUND]: 'The nearby device could not be found. Make sure it\'s close and the app is open.',
  [AppErrorCodes.CONNECTION_TIMEOUT]: 'Connection timed out. Please try again.',
  [AppErrorCodes.CONNECTION_FAILED]: 'Couldn\'t connect. The nearby device may have moved away.',
  [AppErrorCodes.WRITE_FAILED]: 'Failed to send data. The connection may have dropped.',
  [AppErrorCodes.PACKET_INVALID]: 'Received an invalid message that couldn\'t be processed.',
  [AppErrorCodes.PACKET_TOO_LARGE]: 'The message is too large to send.',
  [AppErrorCodes.VERSION_MISMATCH]: 'The other device is using a different app version.',
  [AppErrorCodes.QR_INVALID]: 'This QR code doesn\'t contain a valid identity.',
  [AppErrorCodes.QR_SELF_SCAN]: 'You scanned your own QR code.',
  [AppErrorCodes.DATABASE_ERROR]: 'Something went wrong with local storage.',
  [AppErrorCodes.UNKNOWN_ERROR]: 'Something unexpected happened. Please try again.',
};

// ─── Error Factory ─────────────────────────────────────────────────

export function createAppError(
  code: string,
  message: string,
  retryable: boolean = false,
): AppError {
  return {
    code,
    message,
    userMessage: USER_MESSAGES[code] ?? USER_MESSAGES[AppErrorCodes.UNKNOWN_ERROR]!,
    retryable,
  };
}

/**
 * Convert any thrown value into an AppError.
 */
export function toAppError(err: unknown, fallbackCode?: string): AppError {
  if (err && typeof err === 'object' && 'code' in err && 'userMessage' in err) {
    return err as AppError;
  }

  const message = err instanceof Error ? err.message : String(err);
  return createAppError(
    fallbackCode ?? AppErrorCodes.UNKNOWN_ERROR,
    message,
    false,
  );
}
