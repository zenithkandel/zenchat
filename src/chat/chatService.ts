/**
 * ZenChat Chat — Chat Service
 *
 * Core messaging engine:
 * - Creates, persists, and transmits chat messages
 * - Tracks message delivery status (pending -> sending -> sent -> delivered -> read)
 * - Listens for incoming chat messages & ACKs from BLE protocol engine
 * - Flushes pending message queues on peer reconnection
 */

import { bleProtocolEngine } from '../ble/BleProtocol';
import { sessionManager } from '../ble/BleSession';
import { identityService } from '../identity/identityService';
import { useConversationStore, type ChatMessage } from '../state/stores/useConversationStore';
import { messageRepository, conversationRepository } from '../storage/repositories/conversationRepository';
import { messageQueue } from './messageQueue';
import { createChatMessage } from '../protocol/packets/factory';
import { logger } from '../utils/logger';

export class ChatService {
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) return;

    // Start BLE Protocol engine
    bleProtocolEngine.start();

    // Handle incoming chat messages
    bleProtocolEngine.onChatMessage((packet, peerBleId) => {
      this.handleIncomingChatMessage(packet, peerBleId);
    });

    // Handle incoming chat ACKs
    bleProtocolEngine.onChatAck((packet, peerBleId) => {
      this.handleIncomingChatAck(packet);
    });

    // Handle session state changes to flush queued messages when ready
    sessionManager.subscribe((sessions) => {
      for (const session of sessions) {
        if (session.state === 'ready' && session.peerUserId) {
          this.flushQueueForPeer(session.peerUserId, session.bleId);
        }
      }
    });

    this.isInitialized = true;
    logger.info('CHAT', 'Chat service initialized');
  }

  /**
   * Send a new chat message to a peer.
   */
  async sendMessage(peerUserId: string, peerDisplayName: string, text: string): Promise<ChatMessage> {
    const localIdentity = identityService.getIdentity();
    if (!localIdentity) {
      throw new Error('No local identity found');
    }

    const conversationStore = useConversationStore.getState();
    const conversation = conversationStore.getOrCreateConversation(peerUserId, peerDisplayName);

    // Save to conversation store with initial 'pending' state
    const message = conversationStore.addMessage({
      conversationId: conversation.id,
      senderId: localIdentity.userId,
      receiverId: peerUserId,
      text,
      status: 'pending',
    });

    // Persist in SQLite
    messageRepository.insert(message).catch(err => {
      logger.warn('CHAT', 'Failed to persist message in DB', err);
    });
    conversationRepository.upsert(conversation).catch(err => {
      logger.warn('CHAT', 'Failed to update conversation in DB', err);
    });

    // Find active session for this peer
    const session = sessionManager.getSessionByUserId(peerUserId);

    if (session && session.state === 'ready') {
      await this.transmitMessage(message, session.bleId, session.sessionId);
    } else {
      // Queue for later transmission when peer is connected
      logger.info('CHAT', `Peer ${peerUserId} not currently ready; queuing message ${message.id}`);
      messageQueue.enqueue(message);
    }

    return message;
  }

  /**
   * Transmit a message packet over BLE.
   */
  private async transmitMessage(message: ChatMessage, peerBleId: string, sessionId: string): Promise<void> {
    const conversationStore = useConversationStore.getState();

    try {
      conversationStore.updateMessageStatus(message.id, 'sending');

      const packet = createChatMessage(
        message.senderId,
        sessionId,
        message.text,
        message.receiverId,
      );

      // Save packetId mapping for ACK tracking
      conversationStore.updateMessagePacketId(message.id, packet.packetId);

      await bleProtocolEngine.sendPacket(peerBleId, packet);

      // Mark as 'sent'
      conversationStore.updateMessageStatus(message.id, 'sent');
      messageRepository.updateStatus(message.id, 'sent').catch(() => {});
      logger.info('CHAT', `Message transmitted over BLE: ${message.id} (packetId: ${packet.packetId})`);
    } catch (err) {
      logger.warn('CHAT', `Failed to transmit message: ${message.id}`, err);
      conversationStore.updateMessageStatus(message.id, 'failed');
      messageRepository.updateStatus(message.id, 'failed').catch(() => {});
      messageQueue.markAttemptFailed(message.id);
    }
  }

  /**
   * Retry sending a previously failed message.
   */
  async retryMessage(messageId: string): Promise<void> {
    const conversationStore = useConversationStore.getState();
    conversationStore.incrementRetryCount(messageId);
    conversationStore.updateMessageStatus(messageId, 'pending');

    const allMessages = conversationStore.getPendingMessages();
    const message = allMessages.find(m => m.id === messageId);
    if (!message) return;

    const session = sessionManager.getSessionByUserId(message.receiverId);
    if (session && session.state === 'ready') {
      await this.transmitMessage(message, session.bleId, session.sessionId);
    } else {
      messageQueue.enqueue(message);
    }
  }

  /**
   * Handle incoming chat message packet from peer.
   */
  private handleIncomingChatMessage(packet: any, peerBleId: string): void {
    const conversationStore = useConversationStore.getState();
    const session = sessionManager.getSession(peerBleId);
    const peerDisplayName = session?.peerDisplayName ?? 'Nearby Contact';
    const peerUserId = packet.senderId;

    const conversation = conversationStore.getOrCreateConversation(peerUserId, peerDisplayName);

    const message = conversationStore.addMessage({
      conversationId: conversation.id,
      senderId: peerUserId,
      receiverId: packet.receiverId || identityService.getIdentity()?.userId || 'me',
      text: packet.payload.text,
      status: 'delivered',
      packetId: packet.packetId,
    });

    messageRepository.insert(message).catch(() => {});
    conversationRepository.upsert(conversation).catch(() => {});

    logger.info('CHAT', `Received and saved message from ${peerDisplayName}: "${packet.payload.text}"`);
  }

  /**
   * Handle incoming ACK packet from peer indicating delivery.
   */
  private handleIncomingChatAck(packet: any): void {
    const ackPacketId = packet.payload.ackPacketId;
    const conversationStore = useConversationStore.getState();

    for (const messages of conversationStore.messages.values()) {
      const target = messages.find(m => m.packetId === ackPacketId);
      if (target) {
        conversationStore.updateMessageStatus(target.id, 'delivered');
        messageRepository.updateStatus(target.id, 'delivered').catch(() => {});
        messageQueue.dequeue(target.id);
        logger.info('CHAT', `Message ${target.id} marked as DELIVERED by peer ACK`);
        break;
      }
    }
  }

  /**
   * Flush all queued pending messages when a peer establishes a READY connection.
   */
  private async flushQueueForPeer(peerUserId: string, peerBleId: string): Promise<void> {
    const pending = messageQueue.getPendingForPeer(peerUserId);
    if (pending.length === 0) return;

    logger.info('CHAT', `Flushing ${pending.length} queued messages for peer ${peerUserId}`);
    const session = sessionManager.getSession(peerBleId);
    const sessionId = session?.sessionId ?? 'session';

    for (const item of pending) {
      await this.transmitMessage(item.message, peerBleId, sessionId);
      messageQueue.dequeue(item.message.id);
    }
  }
}

export const chatService = new ChatService();
