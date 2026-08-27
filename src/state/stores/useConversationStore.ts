/**
 * ZenChat State — Conversation & Message Store
 */

import { create } from 'zustand';
import { generateUUID } from '../../utils/uuid';

export type MessageStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  retryCount: number;
  /** The packetId used for this message's transport */
  packetId?: string;
}

export interface Conversation {
  id: string;
  peerUserId: string;
  peerDisplayName: string;
  createdAt: number;
  updatedAt: number;
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount: number;
}

interface ConversationState {
  conversations: Conversation[];
  messages: Map<string, ChatMessage[]>;

  // Conversations
  getOrCreateConversation: (peerUserId: string, peerDisplayName: string) => Conversation;
  getConversation: (conversationId: string) => Conversation | undefined;
  getConversationByPeer: (peerUserId: string) => Conversation | undefined;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  deleteConversation: (conversationId: string) => void;

  // Messages
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'retryCount'>) => ChatMessage;
  getMessages: (conversationId: string) => ChatMessage[];
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  updateMessagePacketId: (messageId: string, packetId: string) => void;
  incrementRetryCount: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  getPendingMessages: () => ChatMessage[];
  getFailedMessages: () => ChatMessage[];

  // Bulk
  clearAllData: () => void;
  markConversationRead: (conversationId: string) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  messages: new Map(),

  getOrCreateConversation: (peerUserId, peerDisplayName) => {
    const existing = get().conversations.find(c => c.peerUserId === peerUserId);
    if (existing) return existing;

    const conversation: Conversation = {
      id: generateUUID(),
      peerUserId,
      peerDisplayName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      unreadCount: 0,
    };

    set((state) => ({
      conversations: [...state.conversations, conversation],
    }));

    return conversation;
  },

  getConversation: (conversationId) => {
    return get().conversations.find(c => c.id === conversationId);
  },

  getConversationByPeer: (peerUserId) => {
    return get().conversations.find(c => c.peerUserId === peerUserId);
  },

  updateConversation: (conversationId, updates) => {
    set((state) => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId ? { ...c, ...updates, updatedAt: Date.now() } : c,
      ),
    }));
  },

  deleteConversation: (conversationId) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.delete(conversationId);
      return {
        conversations: state.conversations.filter(c => c.id !== conversationId),
        messages: newMessages,
      };
    });
  },

  addMessage: (messageData) => {
    const message: ChatMessage = {
      ...messageData,
      id: generateUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    set((state) => {
      const newMessages = new Map(state.messages);
      const existing = newMessages.get(message.conversationId) ?? [];
      newMessages.set(message.conversationId, [...existing, message]);

      // Update conversation's last message
      const conversations = state.conversations.map(c => {
        if (c.id === message.conversationId) {
          return {
            ...c,
            lastMessage: message.text,
            lastMessageAt: message.timestamp,
            updatedAt: Date.now(),
            unreadCount: message.senderId !== message.receiverId
              ? c.unreadCount + (message.senderId !== c.peerUserId ? 0 : 1)
              : c.unreadCount,
          };
        }
        return c;
      });

      return { messages: newMessages, conversations };
    });

    return message;
  },

  getMessages: (conversationId) => {
    return get().messages.get(conversationId) ?? [];
  },

  updateMessageStatus: (messageId, status) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      for (const [convId, msgs] of newMessages) {
        const updated = msgs.map(m =>
          m.id === messageId ? { ...m, status } : m,
        );
        if (updated !== msgs) {
          newMessages.set(convId, updated);
        }
      }
      return { messages: newMessages };
    });
  },

  updateMessagePacketId: (messageId, packetId) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      for (const [convId, msgs] of newMessages) {
        newMessages.set(
          convId,
          msgs.map(m => (m.id === messageId ? { ...m, packetId } : m)),
        );
      }
      return { messages: newMessages };
    });
  },

  incrementRetryCount: (messageId) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      for (const [convId, msgs] of newMessages) {
        newMessages.set(
          convId,
          msgs.map(m =>
            m.id === messageId ? { ...m, retryCount: m.retryCount + 1 } : m,
          ),
        );
      }
      return { messages: newMessages };
    });
  },

  deleteMessage: (messageId) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      for (const [convId, msgs] of newMessages) {
        newMessages.set(convId, msgs.filter(m => m.id !== messageId));
      }
      return { messages: newMessages };
    });
  },

  getPendingMessages: () => {
    const all: ChatMessage[] = [];
    for (const msgs of get().messages.values()) {
      all.push(...msgs.filter(m => m.status === 'pending' || m.status === 'failed'));
    }
    return all;
  },

  getFailedMessages: () => {
    const all: ChatMessage[] = [];
    for (const msgs of get().messages.values()) {
      all.push(...msgs.filter(m => m.status === 'failed'));
    }
    return all;
  },

  clearAllData: () => {
    set({ conversations: [], messages: new Map() });
  },

  markConversationRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },
}));
