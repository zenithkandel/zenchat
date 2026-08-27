/**
 * ZenChat BLE — Protocol & Handshake Engine
 *
 * Orchestrates device-to-device application session establishment:
 * DISCOVERY -> CONNECTION -> HELLO -> IDENTITY -> CAPABILITIES -> READY
 *
 * Routes incoming validated packets to the appropriate subsystem
 * (Chat, Handshake, JSON Lab, Diagnostics).
 */

import { bleTransport } from './BleTransportImpl';
import { sessionManager, type PeerSession } from './BleSession';
import { identityService } from '../identity/identityService';
import {
  type AppPacket,
  type HelloPayload,
  type IdentityPayload,
  type CapabilitiesPayload,
  type PingPayload,
  type PongPayload,
  type ChatMessagePayload,
  type ChatAckPayload,
  type JsonRequestPayload,
  type JsonResponsePayload,
  PROTOCOL_VERSION,
} from '../protocol/packets/types';
import {
  createHello,
  createIdentity,
  createCapabilities,
  createPing,
  createPong,
  createChatAck,
  createDeliveryReceipt,
} from '../protocol/packets/factory';
import { serializePacket, deserializePacket } from '../protocol/serializers/packetSerializer';
import { validatePacket } from '../protocol/validators/packetValidator';
import { chunkData, ChunkReassembler } from '../protocol/chunking/chunker';
import { PacketDeduplicator } from '../protocol/deduplication/deduplicator';
import { logger } from '../utils/logger';

export class BleProtocolEngine {
  private deduplicator = new PacketDeduplicator(1000);
  private reassembler = new ChunkReassembler();
  private isListening = false;

  // Handlers for application layer
  private chatMessageHandlers: Set<(packet: AppPacket<ChatMessagePayload>, peerBleId: string) => void> = new Set();
  private chatAckHandlers: Set<(packet: AppPacket<ChatAckPayload>, peerBleId: string) => void> = new Set();
  private jsonRequestHandlers: Set<(packet: AppPacket<JsonRequestPayload>, peerBleId: string) => void> = new Set();
  private jsonResponseHandlers: Set<(packet: AppPacket<JsonResponsePayload>, peerBleId: string) => void> = new Set();
  private pingPongHandlers: Set<(packet: AppPacket<PingPayload | PongPayload>, peerBleId: string) => void> = new Set();

  start(): void {
    if (this.isListening) return;

    // Listen to incoming data from BLE transport
    bleTransport.onData((peerBleId, rawBytes) => {
      this.handleIncomingBytes(peerBleId, rawBytes);
    });

    // Listen to connection state changes
    bleTransport.onConnectionStateChange((event) => {
      this.handleConnectionStateChange(event.peerId, event.state, event.error);
    });

    this.isListening = true;
    logger.info('PROTOCOL', 'BLE Protocol engine started');
  }

  /**
   * Process incoming raw BLE bytes from a peer.
   */
  private handleIncomingBytes(peerBleId: string, rawBytes: Uint8Array): void {
    try {
      const deserialized = deserializePacket(rawBytes);
      if (!deserialized.success || !deserialized.packet) {
        logger.warn('PROTOCOL', `Failed to deserialize packet from ${peerBleId}: ${deserialized.error}`);
        return;
      }

      const validation = validatePacket(deserialized.packet);
      if (!validation.valid || !validation.packet) {
        logger.warn('PROTOCOL', `Invalid packet from ${peerBleId}: ${validation.error?.message}`);
        return;
      }

      const packet = validation.packet;

      // Handle Chunked packets
      if (packet.type === 'CHUNK') {
        const reassembledJson = this.reassembler.addChunk(packet.payload as any);
        if (reassembledJson) {
          const innerDeserialized = deserializePacket(reassembledJson);
          if (innerDeserialized.success && innerDeserialized.packet) {
            this.processPacket(peerBleId, innerDeserialized.packet);
          }
        }
        return;
      }

      // Check deduplication
      if (this.deduplicator.isDuplicate(packet.packetId)) {
        logger.debug('PROTOCOL', `Duplicate packet ignored: ${packet.packetId}`);
        // If it's a chat message, re-send ACK to ensure peer knows it was received
        if (packet.type === 'CHAT_MESSAGE') {
          this.sendChatAck(peerBleId, packet.packetId);
        }
        return;
      }

      this.processPacket(peerBleId, packet);
    } catch (err) {
      logger.error('PROTOCOL', 'Error handling incoming bytes', err);
    }
  }

  /**
   * Route validated packet according to its type.
   */
  private processPacket(peerBleId: string, packet: AppPacket): void {
    logger.info('PROTOCOL', `Processing ${packet.type} from ${peerBleId} (sender: ${packet.senderId})`);
    sessionManager.touch(peerBleId);

    switch (packet.type) {
      case 'HELLO':
        this.handleHello(peerBleId, packet as AppPacket<HelloPayload>);
        break;

      case 'IDENTITY':
        this.handleIdentity(peerBleId, packet as AppPacket<IdentityPayload>);
        break;

      case 'CAPABILITIES':
        this.handleCapabilities(peerBleId, packet as AppPacket<CapabilitiesPayload>);
        break;

      case 'PING':
        this.handlePing(peerBleId, packet as AppPacket<PingPayload>);
        break;

      case 'PONG':
        this.handlePong(peerBleId, packet as AppPacket<PongPayload>);
        break;

      case 'CHAT_MESSAGE':
        this.handleChatMessage(peerBleId, packet as AppPacket<ChatMessagePayload>);
        break;

      case 'CHAT_ACK':
        this.handleChatAck(peerBleId, packet as AppPacket<ChatAckPayload>);
        break;

      case 'JSON_REQUEST':
        for (const handler of this.jsonRequestHandlers) {
          handler(packet as AppPacket<JsonRequestPayload>, peerBleId);
        }
        break;

      case 'JSON_RESPONSE':
        for (const handler of this.jsonResponseHandlers) {
          handler(packet as AppPacket<JsonResponsePayload>, peerBleId);
        }
        break;

      default:
        logger.debug('PROTOCOL', `Unhandled packet type: ${packet.type}`);
    }
  }

  // ─── Handshake Protocol Handlers ─────────────────────────────────

  private handleConnectionStateChange(peerBleId: string, state: string, error?: string): void {
    if (state === 'connected') {
      let session = sessionManager.getSession(peerBleId);
      if (!session) {
        session = sessionManager.createSession(peerBleId);
      }
      sessionManager.updateState(peerBleId, 'handshaking');

      // Initiate handshake by sending HELLO
      this.sendHello(peerBleId, session.sessionId);
    } else if (state === 'disconnected') {
      sessionManager.updateState(peerBleId, 'disconnected', error);
    }
  }

  private handleHello(peerBleId: string, packet: AppPacket<HelloPayload>): void {
    const session = sessionManager.getSession(peerBleId) || sessionManager.createSession(peerBleId);
    sessionManager.setHandshakeStage(session.sessionId, 'hello_received');

    // Respond with our local identity
    const localIdentity = identityService.getIdentity();
    if (localIdentity) {
      this.sendIdentity(peerBleId, session.sessionId, localIdentity.displayName, localIdentity.publicKey);
    }
  }

  private handleIdentity(peerBleId: string, packet: AppPacket<IdentityPayload>): void {
    const session = sessionManager.getSession(peerBleId) || sessionManager.createSession(peerBleId);
    sessionManager.updatePeerIdentity(
      peerBleId,
      packet.payload.userId,
      packet.payload.displayName,
      packet.payload.publicKey,
      packet.payload.protocolVersion,
    );
    sessionManager.setHandshakeStage(session.sessionId, 'identity_received');

    // Send our capabilities
    this.sendCapabilities(peerBleId, session.sessionId);
  }

  private handleCapabilities(peerBleId: string, packet: AppPacket<CapabilitiesPayload>): void {
    const session = sessionManager.getSession(peerBleId) || sessionManager.createSession(peerBleId);
    sessionManager.updatePeerCapabilities(peerBleId, packet.payload.features);
    sessionManager.setHandshakeStage(session.sessionId, 'ready');
    sessionManager.updateState(peerBleId, 'ready');

    logger.info('PROTOCOL', `Handshake COMPLETE with peer ${peerBleId} (${session.peerDisplayName}). Ready to communicate.`);
  }

  private handlePing(peerBleId: string, packet: AppPacket<PingPayload>): void {
    const localIdentity = identityService.getIdentity();
    const senderId = localIdentity?.userId ?? 'unknown';
    const pongPacket = createPong(senderId, packet.sessionId, packet.packetId, packet.payload.message);

    this.sendPacket(peerBleId, pongPacket).catch(err => {
      logger.error('PROTOCOL', `Failed to send PONG to ${peerBleId}`, err);
    });

    for (const handler of this.pingPongHandlers) {
      handler(packet, peerBleId);
    }
  }

  private handlePong(peerBleId: string, packet: AppPacket<PongPayload>): void {
    logger.info('PROTOCOL', `Received PONG from ${peerBleId}: ${packet.payload.message}`);
    for (const handler of this.pingPongHandlers) {
      handler(packet, peerBleId);
    }
  }

  private handleChatMessage(peerBleId: string, packet: AppPacket<ChatMessagePayload>): void {
    // Automatically send ACK receipt back
    this.sendChatAck(peerBleId, packet.packetId);

    // Notify registered chat handlers
    for (const handler of this.chatMessageHandlers) {
      handler(packet, peerBleId);
    }
  }

  private handleChatAck(peerBleId: string, packet: AppPacket<ChatAckPayload>): void {
    for (const handler of this.chatAckHandlers) {
      handler(packet, peerBleId);
    }
  }

  // ─── Outbound Packet Senders ─────────────────────────────────────

  async sendPacket(peerBleId: string, packet: AppPacket): Promise<void> {
    const serialized = serializePacket(packet);
    if (!serialized.success || !serialized.json || !serialized.data) {
      throw new Error(`Packet serialization error: ${serialized.error}`);
    }

    // Check if chunking is needed (payload > 512 bytes)
    const chunks = chunkData(serialized.json, packet.senderId, packet.sessionId);

    if (chunks && chunks.length > 1) {
      logger.info('PROTOCOL', `Sending ${chunks.length} chunks to ${peerBleId}`);
      for (const chunk of chunks) {
        const chunkSerialized = serializePacket(chunk);
        if (chunkSerialized.data) {
          await bleTransport.send(peerBleId, chunkSerialized.data);
        }
      }
    } else {
      await bleTransport.send(peerBleId, serialized.data);
    }
  }

  async sendHello(peerBleId: string, sessionId: string): Promise<void> {
    const localIdentity = identityService.getIdentity();
    const packet = createHello(localIdentity?.userId ?? 'unknown', sessionId);
    await this.sendPacket(peerBleId, packet);
  }

  async sendIdentity(peerBleId: string, sessionId: string, displayName: string, publicKey?: string): Promise<void> {
    const localIdentity = identityService.getIdentity();
    const packet = createIdentity(localIdentity?.userId ?? 'unknown', sessionId, displayName, publicKey);
    await this.sendPacket(peerBleId, packet);
  }

  async sendCapabilities(peerBleId: string, sessionId: string): Promise<void> {
    const localIdentity = identityService.getIdentity();
    const packet = createCapabilities(localIdentity?.userId ?? 'unknown', sessionId);
    await this.sendPacket(peerBleId, packet);
  }

  async sendChatAck(peerBleId: string, messagePacketId: string): Promise<void> {
    const session = sessionManager.getSession(peerBleId);
    const localIdentity = identityService.getIdentity();
    const sessionId = session?.sessionId ?? 'session';
    const ack = createChatAck(localIdentity?.userId ?? 'unknown', sessionId, messagePacketId, session?.peerUserId ?? peerBleId);
    await this.sendPacket(peerBleId, ack);
  }

  // ─── Event Subscriptions for Application Layer ───────────────────

  onChatMessage(handler: (packet: AppPacket<ChatMessagePayload>, peerBleId: string) => void): () => void {
    this.chatMessageHandlers.add(handler);
    return () => this.chatMessageHandlers.delete(handler);
  }

  onChatAck(handler: (packet: AppPacket<ChatAckPayload>, peerBleId: string) => void): () => void {
    this.chatAckHandlers.add(handler);
    return () => this.chatAckHandlers.delete(handler);
  }

  onJsonRequest(handler: (packet: AppPacket<JsonRequestPayload>, peerBleId: string) => void): () => void {
    this.jsonRequestHandlers.add(handler);
    return () => this.jsonRequestHandlers.delete(handler);
  }

  onJsonResponse(handler: (packet: AppPacket<JsonResponsePayload>, peerBleId: string) => void): () => void {
    this.jsonResponseHandlers.add(handler);
    return () => this.jsonResponseHandlers.delete(handler);
  }

  onPingPong(handler: (packet: AppPacket<PingPayload | PongPayload>, peerBleId: string) => void): () => void {
    this.pingPongHandlers.add(handler);
    return () => this.pingPongHandlers.delete(handler);
  }
}

export const bleProtocolEngine = new BleProtocolEngine();
