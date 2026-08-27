/**
 * ZenChat Protocol — Packet Factory
 *
 * Type-safe constructors for all packet types.
 * Every packet gets a unique packetId and timestamp automatically.
 */

import { generateUUID } from '../../utils/uuid';
import {
  type AppPacket,
  type PacketType,
  type HelloPayload,
  type IdentityPayload,
  type CapabilitiesPayload,
  type PingPayload,
  type PongPayload,
  type ChatMessagePayload,
  type ChatAckPayload,
  type DeliveryReceiptPayload,
  type ReadReceiptPayload,
  type TypingPayload,
  type JsonRequestPayload,
  type JsonResponsePayload,
  type DisconnectPayload,
  type ErrorPayload,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  DEFAULT_FEATURES,
} from './types';

// ─── Base Packet Constructor ───────────────────────────────────────

function createPacket<T>(
  type: PacketType,
  senderId: string,
  sessionId: string,
  payload: T,
  receiverId?: string,
): AppPacket<T> {
  return {
    protocol: PROTOCOL_NAME,
    version: PROTOCOL_VERSION,
    packetId: generateUUID(),
    sessionId,
    type,
    senderId,
    receiverId,
    timestamp: Date.now(),
    payload,
  };
}

// ─── Typed Constructors ────────────────────────────────────────────

export function createHello(
  senderId: string,
  sessionId: string,
  receiverId?: string,
): AppPacket<HelloPayload> {
  return createPacket('HELLO', senderId, sessionId, {
    protocolVersion: PROTOCOL_VERSION,
  }, receiverId);
}

export function createIdentity(
  senderId: string,
  sessionId: string,
  displayName: string,
  publicKey?: string,
  receiverId?: string,
): AppPacket<IdentityPayload> {
  return createPacket('IDENTITY', senderId, sessionId, {
    userId: senderId,
    displayName,
    publicKey,
    protocolVersion: PROTOCOL_VERSION,
  }, receiverId);
}

export function createCapabilities(
  senderId: string,
  sessionId: string,
  features?: string[],
  receiverId?: string,
): AppPacket<CapabilitiesPayload> {
  return createPacket('CAPABILITIES', senderId, sessionId, {
    features: features ?? [...DEFAULT_FEATURES],
  }, receiverId);
}

export function createPing(
  senderId: string,
  sessionId: string,
  message?: string,
  receiverId?: string,
): AppPacket<PingPayload> {
  return createPacket('PING', senderId, sessionId, { message }, receiverId);
}

export function createPong(
  senderId: string,
  sessionId: string,
  echoPacketId?: string,
  message?: string,
  receiverId?: string,
): AppPacket<PongPayload> {
  return createPacket('PONG', senderId, sessionId, {
    message,
    echoPacketId,
  }, receiverId);
}

export function createChatMessage(
  senderId: string,
  sessionId: string,
  text: string,
  receiverId: string,
  sequenceNumber?: number,
): AppPacket<ChatMessagePayload> {
  return createPacket('CHAT_MESSAGE', senderId, sessionId, {
    text,
    sequenceNumber,
  }, receiverId);
}

export function createChatAck(
  senderId: string,
  sessionId: string,
  ackPacketId: string,
  receiverId: string,
): AppPacket<ChatAckPayload> {
  return createPacket('CHAT_ACK', senderId, sessionId, {
    ackPacketId,
  }, receiverId);
}

export function createDeliveryReceipt(
  senderId: string,
  sessionId: string,
  messagePacketId: string,
  receiverId: string,
): AppPacket<DeliveryReceiptPayload> {
  return createPacket('DELIVERY_RECEIPT', senderId, sessionId, {
    messagePacketId,
  }, receiverId);
}

export function createReadReceipt(
  senderId: string,
  sessionId: string,
  messagePacketIds: string[],
  receiverId: string,
): AppPacket<ReadReceiptPayload> {
  return createPacket('READ_RECEIPT', senderId, sessionId, {
    messagePacketIds,
  }, receiverId);
}

export function createTyping(
  senderId: string,
  sessionId: string,
  isTyping: boolean,
  receiverId: string,
): AppPacket<TypingPayload> {
  return createPacket('TYPING', senderId, sessionId, {
    isTyping,
  }, receiverId);
}

export function createJsonRequest(
  senderId: string,
  sessionId: string,
  action: string,
  data: Record<string, unknown>,
  receiverId: string,
): AppPacket<JsonRequestPayload> {
  return createPacket('JSON_REQUEST', senderId, sessionId, {
    action,
    data,
  }, receiverId);
}

export function createJsonResponse(
  senderId: string,
  sessionId: string,
  requestPacketId: string,
  success: boolean,
  data: Record<string, unknown>,
  receiverId: string,
  error?: string,
): AppPacket<JsonResponsePayload> {
  return createPacket('JSON_RESPONSE', senderId, sessionId, {
    requestPacketId,
    success,
    data,
    error,
  }, receiverId);
}

export function createDisconnect(
  senderId: string,
  sessionId: string,
  reason?: string,
  receiverId?: string,
): AppPacket<DisconnectPayload> {
  return createPacket('DISCONNECT', senderId, sessionId, {
    reason,
  }, receiverId);
}

export function createError(
  senderId: string,
  sessionId: string,
  code: string,
  message: string,
  receiverId?: string,
): AppPacket<ErrorPayload> {
  return createPacket('ERROR', senderId, sessionId, {
    code,
    message,
  }, receiverId);
}
