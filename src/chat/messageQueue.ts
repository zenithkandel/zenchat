/**
 * ZenChat Chat — Message Queue
 *
 * Persists outbound messages when a peer is temporarily unavailable.
 * Retries transmission with exponential backoff when a connection returns.
 */

import { logger } from '../utils/logger';
import type { ChatMessage } from '../state/stores/useConversationStore';

export interface QueuedItem {
  message: ChatMessage;
  peerBleId?: string;
  attempts: number;
  nextRetryAt: number;
}

export class MessageQueue {
  private queue: Map<string, QueuedItem> = new Map();
  private isProcessing = false;
  private readonly maxAttempts = 5;
  private readonly baseBackoffMs = 1500;

  enqueue(message: ChatMessage, peerBleId?: string): void {
    if (this.queue.has(message.id)) return;

    this.queue.set(message.id, {
      message,
      peerBleId,
      attempts: 0,
      nextRetryAt: Date.now(),
    });

    logger.info('CHAT', `Message enqueued (queue size: ${this.queue.size}): ${message.id}`);
  }

  dequeue(messageId: string): void {
    this.queue.delete(messageId);
    logger.debug('CHAT', `Message dequeued: ${messageId}`);
  }

  getPendingForPeer(peerUserId: string): QueuedItem[] {
    const now = Date.now();
    const items: QueuedItem[] = [];
    for (const item of this.queue.values()) {
      if (item.message.receiverId === peerUserId && item.nextRetryAt <= now) {
        items.push(item);
      }
    }
    return items;
  }

  markAttemptFailed(messageId: string): void {
    const item = this.queue.get(messageId);
    if (!item) return;

    item.attempts += 1;
    if (item.attempts >= this.maxAttempts) {
      logger.warn('CHAT', `Message ${messageId} reached max retry attempts`);
      // Keep in queue but mark long backoff or let user manually retry
      item.nextRetryAt = Date.now() + 60000;
    } else {
      const delay = this.baseBackoffMs * Math.pow(2, item.attempts);
      item.nextRetryAt = Date.now() + delay;
      logger.info('CHAT', `Message ${messageId} retry in ${delay}ms (attempt ${item.attempts})`);
    }
  }

  get size(): number {
    return this.queue.size;
  }

  clear(): void {
    this.queue.clear();
  }
}

export const messageQueue = new MessageQueue();
