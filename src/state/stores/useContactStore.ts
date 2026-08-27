/**
 * ZenChat State — Contact Store
 */

import { create } from 'zustand';

export interface Contact {
  userId: string;
  displayName: string;
  publicKey?: string;
  localNickname?: string;
  addedAt: number;
  lastSeenAt?: number;
  lastKnownBleId?: string;
  trusted: boolean;
  blocked: boolean;
  verified: boolean;
}

interface ContactState {
  contacts: Contact[];

  addContact: (contact: Omit<Contact, 'addedAt' | 'trusted' | 'blocked' | 'verified'>) => void;
  updateContact: (userId: string, updates: Partial<Contact>) => void;
  removeContact: (userId: string) => void;
  blockContact: (userId: string) => void;
  unblockContact: (userId: string) => void;
  trustContact: (userId: string) => void;
  verifyContact: (userId: string) => void;
  getContact: (userId: string) => Contact | undefined;
  setContacts: (contacts: Contact[]) => void;
  setLocalNickname: (userId: string, nickname: string) => void;
  updateLastSeen: (userId: string, timestamp: number, bleId?: string) => void;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],

  addContact: (contact) => {
    set((state) => {
      // Don't add duplicates
      if (state.contacts.find(c => c.userId === contact.userId)) {
        return state;
      }
      return {
        contacts: [...state.contacts, {
          ...contact,
          addedAt: Date.now(),
          trusted: false,
          blocked: false,
          verified: false,
        }],
      };
    });
  },

  updateContact: (userId, updates) => {
    set((state) => ({
      contacts: state.contacts.map(c =>
        c.userId === userId ? { ...c, ...updates } : c,
      ),
    }));
  },

  removeContact: (userId) => {
    set((state) => ({
      contacts: state.contacts.filter(c => c.userId !== userId),
    }));
  },

  blockContact: (userId) => {
    set((state) => ({
      contacts: state.contacts.map(c =>
        c.userId === userId ? { ...c, blocked: true } : c,
      ),
    }));
  },

  unblockContact: (userId) => {
    set((state) => ({
      contacts: state.contacts.map(c =>
        c.userId === userId ? { ...c, blocked: false } : c,
      ),
    }));
  },

  trustContact: (userId) => {
    set((state) => ({
      contacts: state.contacts.map(c =>
        c.userId === userId ? { ...c, trusted: true } : c,
      ),
    }));
  },

  verifyContact: (userId) => {
    set((state) => ({
      contacts: state.contacts.map(c =>
        c.userId === userId ? { ...c, verified: true, trusted: true } : c,
      ),
    }));
  },

  getContact: (userId) => {
    return get().contacts.find(c => c.userId === userId);
  },

  setContacts: (contacts) => set({ contacts }),

  setLocalNickname: (userId, nickname) => {
    set((state) => ({
      contacts: state.contacts.map(c =>
        c.userId === userId ? { ...c, localNickname: nickname } : c,
      ),
    }));
  },

  updateLastSeen: (userId, timestamp, bleId) => {
    set((state) => ({
      contacts: state.contacts.map(c =>
        c.userId === userId
          ? { ...c, lastSeenAt: timestamp, lastKnownBleId: bleId ?? c.lastKnownBleId }
          : c,
      ),
    }));
  },
}));
