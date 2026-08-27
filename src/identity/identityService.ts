/**
 * ZenChat — Identity Service
 *
 * Manages the local user identity:
 * - Create on first launch
 * - Persist across restarts
 * - Generate QR-compatible identity data
 */

import { generateUUID } from '../utils/uuid';
import { logger } from '../utils/logger';

// ─── Types ─────────────────────────────────────────────────────────

export interface LocalIdentity {
  /** Randomly generated unique user ID */
  userId: string;
  /** Human-friendly display name */
  displayName: string;
  /** When this identity was created */
  createdAt: number;
  /** Ed25519 public key (base64) for future crypto */
  publicKey?: string;
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

/**
 * Simple key-value storage interface.
 * Implemented by MMKV or AsyncStorage.
 */
export interface KVStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  contains(key: string): boolean;
}

// ─── In-Memory Fallback Storage ────────────────────────────────────

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
    // Start with in-memory; will be upgraded to MMKV when available
    this.storage = new InMemoryStorage();
  }

  /**
   * Set the backing storage (call after MMKV is initialized).
   */
  setStorage(storage: KVStorage): void {
    this.storage = storage;
    this.cachedIdentity = null; // Force reload from new storage
    logger.info('IDENTITY', 'Storage backend updated');
  }

  /**
   * Check if a local identity exists.
   */
  hasIdentity(): boolean {
    return this.storage.contains(STORAGE_KEY_IDENTITY);
  }

  /**
   * Get the current identity, or null if none exists.
   */
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

  /**
   * Create a new local identity with the given display name.
   */
  createIdentity(displayName: string, deviceLabel?: string): LocalIdentity {
    const identity: LocalIdentity = {
      userId: generateUUID(),
      displayName: displayName.trim(),
      createdAt: Date.now(),
      deviceLabel,
      protocolVersion: PROTOCOL_VERSION,
    };

    this.saveIdentity(identity);
    logger.info('IDENTITY', `Identity created: ${identity.userId}`);
    return identity;
  }

  /**
   * Update the display name.
   */
  updateDisplayName(name: string): LocalIdentity | null {
    const identity = this.getIdentity();
    if (!identity) return null;

    identity.displayName = name.trim();
    this.saveIdentity(identity);
    logger.info('IDENTITY', `Display name updated to: ${name}`);
    return identity;
  }

  /**
   * Reset the identity (creates a new one).
   * WARNING: This is destructive — other users won't recognize this device.
   */
  resetIdentity(): void {
    this.storage.delete(STORAGE_KEY_IDENTITY);
    this.cachedIdentity = null;
    logger.warn('IDENTITY', 'Identity reset');
  }

  /**
   * Generate a QR-compatible identity payload.
   */
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

  /**
   * Encode QR payload as a compact string.
   */
  encodeQRString(): string | null {
    const payload = this.getQRPayload();
    if (!payload) return null;
    return JSON.stringify(payload);
  }

  /**
   * Validate and parse a scanned QR string.
   */
  static parseQRString(qrString: string): QRIdentityPayload | null {
    try {
      const data = JSON.parse(qrString);

      // Validate required fields
      if (data.type !== 'USER_IDENTITY') return null;
      if (typeof data.version !== 'number') return null;
      if (typeof data.userId !== 'string' || data.userId.length === 0) return null;
      if (typeof data.displayName !== 'string' || data.displayName.length === 0) return null;

      // Length limits
      if (data.displayName.length > 100) return null;
      if (data.userId.length > 100) return null;

      return data as QRIdentityPayload;
    } catch {
      return null;
    }
  }

  // ─── Private ─────────────────────────────────────────────────

  private saveIdentity(identity: LocalIdentity): void {
    const raw = JSON.stringify(identity);
    this.storage.set(STORAGE_KEY_IDENTITY, raw);
    this.cachedIdentity = identity;
  }
}

export const identityService = new IdentityService();
