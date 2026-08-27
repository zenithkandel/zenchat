/**
 * ZenChat Storage — Conversation & Message Repositories
 *
 * Parameterized SQL for conversations and chat messages.
 */

import { databaseManager } from '../database';
import type { Conversation, ChatMessage, MessageStatus } from '../../state/stores/useConversationStore';

export class ConversationRepository {
  async getAll(): Promise<Conversation[]> {
    const db = await databaseManager.getAdapter();
    const result = await db.execute('SELECT * FROM conversations ORDER BY last_message_at DESC, updated_at DESC');
    return result.rows.map(row => ({
      id: row.id,
      peerUserId: row.peer_user_id,
      peerDisplayName: row.peer_display_name,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at ? Number(row.last_message_at) : undefined,
      unreadCount: Number(row.unread_count || 0),
    }));
  }

  async getByPeer(peerUserId: string): Promise<Conversation | null> {
    const db = await databaseManager.getAdapter();
    const result = await db.execute('SELECT * FROM conversations WHERE peer_user_id = ? LIMIT 1', [peerUserId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      peerUserId: row.peer_user_id,
      peerDisplayName: row.peer_display_name,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at ? Number(row.last_message_at) : undefined,
      unreadCount: Number(row.unread_count || 0),
    };
  }

  async upsert(conv: Conversation): Promise<void> {
    const db = await databaseManager.getAdapter();
    await db.execute(
      `INSERT INTO conversations (id, peer_user_id, peer_display_name, created_at, updated_at, last_message, last_message_at, unread_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         peer_display_name = excluded.peer_display_name,
         updated_at = excluded.updated_at,
         last_message = excluded.last_message,
         last_message_at = excluded.last_message_at,
         unread_count = excluded.unread_count;`,
      [
        conv.id,
        conv.peerUserId,
        conv.peerDisplayName,
        conv.createdAt,
        conv.updatedAt,
        conv.lastMessage ?? null,
        conv.lastMessageAt ?? null,
        conv.unreadCount,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    const db = await databaseManager.getAdapter();
    await db.execute('DELETE FROM messages WHERE conversation_id = ?', [id]);
    await db.execute('DELETE FROM conversations WHERE id = ?', [id]);
  }
}

export class MessageRepository {
  async getByConversation(conversationId: string): Promise<ChatMessage[]> {
    const db = await databaseManager.getAdapter();
    const result = await db.execute(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
      [conversationId],
    );
    return result.rows.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      text: row.text,
      timestamp: Number(row.timestamp),
      status: row.status as MessageStatus,
      retryCount: Number(row.retry_count || 0),
      packetId: row.packet_id,
    }));
  }

  async insert(message: ChatMessage): Promise<void> {
    const db = await databaseManager.getAdapter();
    await db.execute(
      `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, text, timestamp, status, retry_count, packet_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message.id,
        message.conversationId,
        message.senderId,
        message.receiverId,
        message.text,
        message.timestamp,
        message.status,
        message.retryCount,
        message.packetId ?? null,
      ],
    );
  }

  async updateStatus(messageId: string, status: MessageStatus): Promise<void> {
    const db = await databaseManager.getAdapter();
    await db.execute('UPDATE messages SET status = ? WHERE id = ?', [status, messageId]);
  }

  async updateStatusByPacketId(packetId: string, status: MessageStatus): Promise<void> {
    const db = await databaseManager.getAdapter();
    await db.execute('UPDATE messages SET status = ? WHERE packet_id = ?', [status, packetId]);
  }

  async getPending(): Promise<ChatMessage[]> {
    const db = await databaseManager.getAdapter();
    const result = await db.execute(
      "SELECT * FROM messages WHERE status IN ('pending', 'failed') ORDER BY timestamp ASC",
    );
    return result.rows.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      text: row.text,
      timestamp: Number(row.timestamp),
      status: row.status as MessageStatus,
      retryCount: Number(row.retry_count || 0),
      packetId: row.packet_id,
    }));
  }
}

export class PacketLogRepository {
  async log(entry: {
    id: string;
    packetId: string;
    type: string;
    direction: 'sent' | 'received';
    peerId?: string;
    timestamp: number;
    status: 'success' | 'failed';
    size: number;
    jsonPayload?: string;
  }): Promise<void> {
    const db = await databaseManager.getAdapter();
    await db.execute(
      `INSERT INTO packet_log (id, packet_id, type, direction, peer_id, timestamp, status, size, json_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.packetId,
        entry.type,
        entry.direction,
        entry.peerId ?? null,
        entry.timestamp,
        entry.status,
        entry.size,
        entry.jsonPayload ?? null,
      ],
    );
  }

  async getRecent(limit: number = 100): Promise<any[]> {
    const db = await databaseManager.getAdapter();
    const result = await db.execute(
      'SELECT * FROM packet_log ORDER BY timestamp DESC LIMIT ?',
      [limit],
    );
    return result.rows;
  }
}

export const conversationRepository = new ConversationRepository();
export const messageRepository = new MessageRepository();
export const packetLogRepository = new PacketLogRepository();
