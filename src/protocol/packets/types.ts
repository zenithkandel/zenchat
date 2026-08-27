/**
 * ZenChat Protocol — Packet Types
 *
 * ONE well-defined packet envelope for all communication.
 * Every packet has a unique packetId, session context, and typed payload.
 */

// ─── Packet Type Union ─────────────────────────────────────────────

export type PacketType =
  | 'HELLO'
  | 'IDENTITY'
  | 'CAPABILITIES'
  | 'PING'
  | 'PONG'
  | 'CHAT_MESSAGE'
  | 'CHAT_ACK'
  | 'DELIVERY_RECEIPT'
  | 'READ_RECEIPT'
  | 'TYPING'
  | 'JSON_REQUEST'
  | 'JSON_RESPONSE'
  | 'CONTACT_REQUEST'
  | 'CONTACT_RESPONSE'
  | 'DISCONNECT'
  | 'ERROR'
  | 'CHUNK';

// ─── Core Packet Envelope ──────────────────────────────────────────

export interface AppPacket<T = unknown> {
  /** Protocol identifier — always 'LOCAL_LINK' */
  protocol: 'LOCAL_LINK';
  /** Protocol version */
  version: number;
  /** Unique packet identifier (UUID v4) */
  packetId: string;
  /** Session this packet belongs to */
  sessionId: string;
  /** Packet type discriminator */
  type: PacketType;
  /** Sender's userId */
  senderId: string;
  /** Intended receiver's userId (optional for broadcast-like packets) */
  receiverId?: string;
  /** Unix timestamp (milliseconds) when packet was created */
  timestamp: number;
  /** Type-safe payload */
  payload: T;
}

// ─── Payload Types ─────────────────────────────────────────────────

export interface HelloPayload {
  protocolVersion: number;
  deviceLabel?: string;
}

export interface IdentityPayload {
  userId: string;
  displayName: string;
  publicKey?: string;
  protocolVersion: number;
}

export interface CapabilitiesPayload {
  features: string[];
}

export interface PingPayload {
  message?: string;
}

export interface PongPayload {
  message?: string;
  /** Echo the original ping's packetId */
  echoPacketId?: string;
}

export interface ChatMessagePayload {
  text: string;
  /** Client-side sequence number for ordering */
  sequenceNumber?: number;
}

export interface ChatAckPayload {
  /** The packetId of the message being acknowledged */
  ackPacketId: string;
}

export interface DeliveryReceiptPayload {
  /** The packetId of the delivered message */
  messagePacketId: string;
}

export interface ReadReceiptPayload {
  /** The packetIds of the read messages */
  messagePacketIds: string[];
}

export interface TypingPayload {
  isTyping: boolean;
}

export interface JsonRequestPayload {
  action: string;
  data: Record<string, unknown>;
}

export interface JsonResponsePayload {
  /** The packetId of the request being responded to */
  requestPacketId: string;
  success: boolean;
  data: Record<string, unknown>;
  error?: string;
}

export interface ContactRequestPayload {
  userId: string;
  displayName: string;
  publicKey?: string;
}

export interface ContactResponsePayload {
  accepted: boolean;
  userId: string;
  displayName: string;
  publicKey?: string;
}

export interface DisconnectPayload {
  reason?: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface ChunkPayload {
  /** Unique transfer identifier grouping all chunks */
  transferId: string;
  /** Zero-based chunk index */
  chunkIndex: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Base64 encoded chunk data */
  data: string;
}

// ─── Typed Packet Aliases ──────────────────────────────────────────

export type HelloPacket = AppPacket<HelloPayload>;
export type IdentityPacket = AppPacket<IdentityPayload>;
export type CapabilitiesPacket = AppPacket<CapabilitiesPayload>;
export type PingPacket = AppPacket<PingPayload>;
export type PongPacket = AppPacket<PongPayload>;
export type ChatMessagePacket = AppPacket<ChatMessagePayload>;
export type ChatAckPacket = AppPacket<ChatAckPayload>;
export type DeliveryReceiptPacket = AppPacket<DeliveryReceiptPayload>;
export type ReadReceiptPacket = AppPacket<ReadReceiptPayload>;
export type TypingPacket = AppPacket<TypingPayload>;
export type JsonRequestPacket = AppPacket<JsonRequestPayload>;
export type JsonResponsePacket = AppPacket<JsonResponsePayload>;
export type ContactRequestPacket = AppPacket<ContactRequestPayload>;
export type ContactResponsePacket = AppPacket<ContactResponsePayload>;
export type DisconnectPacket = AppPacket<DisconnectPayload>;
export type ErrorPacket = AppPacket<ErrorPayload>;
export type ChunkPacket = AppPacket<ChunkPayload>;

// ─── Protocol Constants ────────────────────────────────────────────

export const PROTOCOL_NAME = 'LOCAL_LINK' as const;
export const PROTOCOL_VERSION = 1;

// ─── Feature Constants ─────────────────────────────────────────────

export const FEATURES = {
  CHAT: 'chat',
  JSON: 'json',
  QR_IDENTITY: 'qr-identity',
  CHUNKING: 'chunking',
} as const;

export const DEFAULT_FEATURES = [
  FEATURES.CHAT,
  FEATURES.JSON,
  FEATURES.QR_IDENTITY,
  FEATURES.CHUNKING,
] as const;

// ─── Error Codes ───────────────────────────────────────────────────

export const ERROR_CODES = {
  INVALID_PACKET: 'INVALID_PACKET',
  UNKNOWN_TYPE: 'UNKNOWN_TYPE',
  VERSION_MISMATCH: 'VERSION_MISMATCH',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  PACKET_TOO_LARGE: 'PACKET_TOO_LARGE',
  DUPLICATE_PACKET: 'DUPLICATE_PACKET',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ─── Valid Packet Types Set ────────────────────────────────────────

export const VALID_PACKET_TYPES: Set<string> = new Set<string>([
  'HELLO',
  'IDENTITY',
  'CAPABILITIES',
  'PING',
  'PONG',
  'CHAT_MESSAGE',
  'CHAT_ACK',
  'DELIVERY_RECEIPT',
  'READ_RECEIPT',
  'TYPING',
  'JSON_REQUEST',
  'JSON_RESPONSE',
  'CONTACT_REQUEST',
  'CONTACT_RESPONSE',
  'DISCONNECT',
  'ERROR',
  'CHUNK',
]);
