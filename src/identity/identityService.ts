/**
 * ZenChat — Identity Service
 *
 * Manages the local user identity:
 * - Create on first launch
 * - Persist across restarts using MMKV (or fallback in-memory)
 * - Cryptographic keypair integration
 * - Generate and validate QR identity payloads
 */

import { generateUUID } from '../utils/uuid';
import { logger } from '../utils/logger';
import { cryptoService } from '../crypto/cryptoService';

// ─── Types ─────────────────────────────────────────────────────────

export interface LocalIdentity {
  /** Randomly generated unique user ID */
  userId: string;
  /** Human-friendly display name */
  displayName: string;
  /** When this identity was created */
  createdAt: number;
  /** Ed25519 public key (hex) */
  publicKey?: string;
  /** Private key reference (stored securely) */
  privateKey?: string;
  /** Device label (e.g., "iPhone", "Pixel") */
  deviceLabel?: string;
  /** Protocol version this identity was created with */
  protocolVersion: number;
}

export interface QRIdentityPayload {
  type: 'USER_IDENTITY';
  version: number;
  userId: string;
  displayName: string;
  publicKey?: string;
  protocolVersion: number;
}

// ─── Storage Interface ─────────────────────────────────────────────

export interface KVStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  contains(key: string): boolean;
}

class InMemoryStorage implements KVStorage {
  private data: Map<string, string> = new Map();

  getString(key: string): string | undefined {
    return this.data.get(key);
  }

  set(key: string, value: string): void {
    this.data.set(key, value);
  }

  delete(key: string): void {
    this.data.delete(key);
  }

  contains(key: string): boolean {
    return this.data.has(key);
  }
}

// ─── Constants ─────────────────────────────────────────────────────

const STORAGE_KEY_IDENTITY = 'zenchat_identity';
const PROTOCOL_VERSION = 1;

// ─── Identity Service ──────────────────────────────────────────────

class IdentityService {
  private storage: KVStorage;
  private cachedIdentity: LocalIdentity | null = null;

  constructor() {
    this.storage = new InMemoryStorage();
    this.initMMKV();
  }

  private initMMKV(): void {
    try {
      const { MMKV } = require('react-native-mmkv');
      const mmkvInstance = new MMKV({ id: 'zenchat-storage' });
      this.storage = {
        getString: (key: string) => mmkvInstance.getString(key),
        set: (key: string, value: string) => mmkvInstance.set(key, value),
        delete: (key: string) => mmkvInstance.delete(key),
        contains: (key: string) => mmkvInstance.contains(key),
      };
      logger.info('IDENTITY', 'MMKV storage backend initialized');
    } catch {
      logger.info('IDENTITY', 'MMKV unavailable; using in-memory store');
    }
  }

  setStorage(storage: KVStorage): void {
    this.storage = storage;
    this.cachedIdentity = null;
    logger.info('IDENTITY', 'Storage backend updated');
  }

  hasIdentity(): boolean {
    return this.storage.contains(STORAGE_KEY_IDENTITY);
  }

  getIdentity(): LocalIdentity | null {
    if (this.cachedIdentity) {
      return this.cachedIdentity;
    }

    const raw = this.storage.getString(STORAGE_KEY_IDENTITY);
    if (!raw) return null;

    try {
      const identity = JSON.parse(raw) as LocalIdentity;
      this.cachedIdentity = identity;
      return identity;
    } catch (error) {
      logger.error('IDENTITY', 'Failed to parse stored identity', error);
      return null;
    }
  }

  createIdentity(displayName: string, deviceLabel?: string): LocalIdentity {
    const rawEntropy = generateUUID() + '-' + Date.now().toString(16);
    const userId = generateUUID();

    const identity: LocalIdentity = {
      userId,
      displayName: displayName.trim(),
      createdAt: Date.now(),
      publicKey: 'pk_' + userId.replace(/-/g, '').slice(0, 32),
      deviceLabel,
      protocolVersion: PROTOCOL_VERSION,
    };

    // Asynchronously generate full crypto keypair in background
    cryptoService.generateIdentity().then((keyPair) => {
      const current = this.getIdentity();
      if (current && current.userId === userId) {
        current.publicKey = keyPair.publicKey;
        current.privateKey = keyPair.privateKey;
        this.saveIdentity(current);
      }
    }).catch(err => {
      logger.warn('IDENTITY', 'Background key generation failed', err);
    });

    this.saveIdentity(identity);
    logger.info('IDENTITY', `Identity created: ${identity.userId} for "${identity.displayName}"`);
    return identity;
  }

  updateDisplayName(name: string): LocalIdentity | null {
    const identity = this.getIdentity();
    if (!identity) return null;

    identity.displayName = name.trim();
    this.saveIdentity(identity);
    logger.info('IDENTITY', `Display name updated to: ${name}`);
    return identity;
  }

  resetIdentity(): void {
    this.storage.delete(STORAGE_KEY_IDENTITY);
    this.cachedIdentity = null;
    logger.warn('IDENTITY', 'Local identity reset');
  }

  getQRPayload(): QRIdentityPayload | null {
    const identity = this.getIdentity();
    if (!identity) return null;

    return {
      type: 'USER_IDENTITY',
      version: 1,
      userId: identity.userId,
      displayName: identity.displayName,
      publicKey: identity.publicKey,
      protocolVersion: identity.protocolVersion,
    };
  }

  encodeQRString(): string | null {
    const payload = this.getQRPayload();
    if (!payload) return null;
    return JSON.stringify(payload);
  }

  static parseQRString(qrString: string): QRIdentityPayload | null {
    try {
      const data = JSON.parse(qrString);

      if (data.type !== 'USER_IDENTITY') return null;
      if (typeof data.version !== 'number') return null;
      if (typeof data.userId !== 'string' || data.userId.length === 0) return null;
      if (typeof data.displayName !== 'string' || data.displayName.length === 0) return null;

      if (data.displayName.length > 100) return null;
      if (data.userId.length > 100) return null;

      return data as QRIdentityPayload;
    } catch {
      return null;
    }
  }

  private saveIdentity(identity: LocalIdentity): void {
    const raw = JSON.stringify(identity);
    this.storage.set(STORAGE_KEY_IDENTITY, raw);
    this.cachedIdentity = identity;
  }
}

export const identityService = new IdentityService();
