/**
 * ZenChat Protocol — Packet Validator
 *
 * Full validation pipeline for incoming packets:
 * parse → schema → version → type → sender → application handling
 *
 * Malformed packets never crash the app.
 */

import {
  type AppPacket,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  VALID_PACKET_TYPES,
  ERROR_CODES,
} from '../packets/types';

export interface ValidationResult {
  valid: boolean;
  packet?: AppPacket;
  error?: {
    code: string;
    message: string;
  };
}

/** Maximum allowed packet size in bytes (64KB) */
const MAX_PACKET_SIZE = 65536;

/** Maximum display name length */
const MAX_DISPLAY_NAME_LENGTH = 100;

/** Maximum text message length */
const MAX_TEXT_LENGTH = 4096;

/**
 * Validate a raw JSON string or parsed object as an AppPacket.
 */
export function validatePacket(input: unknown): ValidationResult {
  // Step 1: Ensure we have an object
  if (input === null || input === undefined) {
    return invalid(ERROR_CODES.INVALID_PACKET, 'Packet is null or undefined');
  }

  let packet: Record<string, unknown>;

  if (typeof input === 'string') {
    try {
      packet = JSON.parse(input) as Record<string, unknown>;
    } catch {
      return invalid(ERROR_CODES.INVALID_PACKET, 'Invalid JSON');
    }
  } else if (typeof input === 'object') {
    packet = input as Record<string, unknown>;
  } else {
    return invalid(ERROR_CODES.INVALID_PACKET, 'Packet must be a JSON object');
  }

  // Step 2: Protocol check
  if (packet.protocol !== PROTOCOL_NAME) {
    return invalid(
      ERROR_CODES.INVALID_PACKET,
      `Unknown protocol: ${String(packet.protocol)}. Expected: ${PROTOCOL_NAME}`,
    );
  }

  // Step 3: Version check
  if (typeof packet.version !== 'number') {
    return invalid(ERROR_CODES.INVALID_PACKET, 'Missing or invalid version field');
  }

  if (packet.version > PROTOCOL_VERSION) {
    return invalid(
      ERROR_CODES.VERSION_MISMATCH,
      `Incompatible protocol version: ${packet.version}. This device supports v${PROTOCOL_VERSION}`,
    );
  }

  // Step 4: Required fields
  if (typeof packet.packetId !== 'string' || packet.packetId.length === 0) {
    return invalid(ERROR_CODES.INVALID_PACKET, 'Missing or empty packetId');
  }

  if (typeof packet.sessionId !== 'string' || packet.sessionId.length === 0) {
    return invalid(ERROR_CODES.INVALID_PACKET, 'Missing or empty sessionId');
  }

  if (typeof packet.type !== 'string') {
    return invalid(ERROR_CODES.INVALID_PACKET, 'Missing packet type');
  }

  if (typeof packet.senderId !== 'string' || packet.senderId.length === 0) {
    return invalid(ERROR_CODES.INVALID_PACKET, 'Missing or empty senderId');
  }

  if (typeof packet.timestamp !== 'number') {
    return invalid(ERROR_CODES.INVALID_PACKET, 'Missing or invalid timestamp');
  }

  // Step 5: Valid packet type
  if (!VALID_PACKET_TYPES.has(packet.type)) {
    return invalid(ERROR_CODES.UNKNOWN_TYPE, `Unknown packet type: ${packet.type}`);
  }

  // Step 6: Payload validation for specific types
  const payloadError = validatePayload(packet.type as string, packet.payload);
  if (payloadError) {
    return invalid(ERROR_CODES.INVALID_PACKET, payloadError);
  }

  // Step 7: Size check (stringify to estimate)
  try {
    const size = JSON.stringify(packet).length;
    if (size > MAX_PACKET_SIZE) {
      return invalid(ERROR_CODES.PACKET_TOO_LARGE, `Packet size ${size} exceeds maximum ${MAX_PACKET_SIZE}`);
    }
  } catch {
    // If stringify fails, the packet itself is problematic
    return invalid(ERROR_CODES.INVALID_PACKET, 'Packet cannot be serialized');
  }

  return { valid: true, packet: packet as unknown as AppPacket };
}

/**
 * Validate payload contents based on packet type.
 */
function validatePayload(type: string, payload: unknown): string | null {
  if (payload === undefined || payload === null) {
    // Some types can have empty payloads
    if (['PING', 'PONG', 'DISCONNECT'].includes(type)) {
      return null;
    }
    return 'Missing payload';
  }

  if (typeof payload !== 'object') {
    return 'Payload must be an object';
  }

  const p = payload as Record<string, unknown>;

  switch (type) {
    case 'IDENTITY':
      if (typeof p.userId !== 'string' || p.userId.length === 0) {
        return 'IDENTITY requires userId';
      }
      if (typeof p.displayName !== 'string' || p.displayName.length === 0) {
        return 'IDENTITY requires displayName';
      }
      if (p.displayName.length > MAX_DISPLAY_NAME_LENGTH) {
        return `Display name exceeds ${MAX_DISPLAY_NAME_LENGTH} characters`;
      }
      break;

    case 'CHAT_MESSAGE':
      if (typeof p.text !== 'string' || p.text.length === 0) {
        return 'CHAT_MESSAGE requires non-empty text';
      }
      if (p.text.length > MAX_TEXT_LENGTH) {
        return `Message exceeds ${MAX_TEXT_LENGTH} characters`;
      }
      break;

    case 'CHAT_ACK':
      if (typeof p.ackPacketId !== 'string') {
        return 'CHAT_ACK requires ackPacketId';
      }
      break;

    case 'CAPABILITIES':
      if (!Array.isArray(p.features)) {
        return 'CAPABILITIES requires features array';
      }
      break;

    case 'CHUNK':
      if (typeof p.transferId !== 'string') return 'CHUNK requires transferId';
      if (typeof p.chunkIndex !== 'number') return 'CHUNK requires chunkIndex';
      if (typeof p.totalChunks !== 'number') return 'CHUNK requires totalChunks';
      if (typeof p.data !== 'string') return 'CHUNK requires data';
      if (p.chunkIndex < 0 || p.chunkIndex >= p.totalChunks) {
        return 'CHUNK has invalid chunkIndex';
      }
      break;

    case 'ERROR':
      if (typeof p.code !== 'string') return 'ERROR requires code';
      if (typeof p.message !== 'string') return 'ERROR requires message';
      break;
  }

  return null;
}

function invalid(code: string, message: string): ValidationResult {
  return { valid: false, error: { code, message } };
}
