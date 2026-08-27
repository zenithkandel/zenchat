import { MessageQueue } from '../src/chat/messageQueue';
import type { ChatMessage } from '../src/state/stores/useConversationStore';

describe('Offline Message Queue', () => {
  const dummyMessage: ChatMessage = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-a',
    receiverId: 'user-b',
    text: 'Offline queued test message',
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };

  test('enqueues and retrieves pending messages for a peer', () => {
    const queue = new MessageQueue();
    queue.enqueue(dummyMessage);
    expect(queue.size).toBe(1);

    const pending = queue.getPendingForPeer('user-b');
    expect(pending.length).toBe(1);
    expect(pending[0]?.message.text).toBe('Offline queued test message');
  });

  test('dequeues message when acknowledged or sent', () => {
    const queue = new MessageQueue();
    queue.enqueue(dummyMessage);
    queue.dequeue(dummyMessage.id);
    expect(queue.size).toBe(0);
  });

  test('calculates exponential backoff on failed attempt', () => {
    const queue = new MessageQueue();
    queue.enqueue(dummyMessage);
    queue.markAttemptFailed(dummyMessage.id);

    // Immediately after failure, item is delayed and not immediately pending
    const immediate = queue.getPendingForPeer('user-b');
    expect(immediate.length).toBe(0);
  });
});
