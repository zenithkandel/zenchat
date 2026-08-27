/**
 * ZenChat BLE — Session Management
 *
 * Manages peer sessions with state machine:
 * disconnected → discovering → connecting → connected → handshaking → ready
 *
 * Orchestrates the handshake protocol: HELLO → IDENTITY → CAPABILITIES → READY
 */

import { generateUUID } from '../utils/uuid';
import { logger } from '../utils/logger';
import type { ConnectionState } from './BleTransport';

// ─── Types ─────────────────────────────────────────────────────────

export interface PeerSession {
  /** Unique session identifier */
  sessionId: string;
  /** BLE device identifier */
  bleId: string;
  /** Application-level user ID (learned during handshake) */
  peerUserId?: string;
  /** Display name (learned during handshake) */
  peerDisplayName?: string;
  /** Public key (learned during handshake) */
  peerPublicKey?: string;
  /** Current session state */
  state: ConnectionState;
  /** Peer's supported features */
  features: string[];
  /** Peer's protocol version */
  peerProtocolVersion?: number;
  /** When the session was created */
  createdAt: number;
  /** When the connection was established */
  connectedAt?: number;
  /** Last activity timestamp */
  lastActivityAt?: number;
  /** Error message if state is 'error' */
  errorMessage?: string;
}

export type HandshakeStage =
  | 'none'
  | 'hello_sent'
  | 'hello_received'
  | 'identity_sent'
  | 'identity_received'
  | 'capabilities_sent'
  | 'capabilities_received'
  | 'ready';

// ─── Session Manager ──────────────────────────────────────────────

class SessionManager {
  private sessions: Map<string, PeerSession> = new Map();
  private handshakeStages: Map<string, HandshakeStage> = new Map();
  private listeners: Set<(sessions: PeerSession[]) => void> = new Set();

  /**
   * Create a new session for a peer.
   */
  createSession(bleId: string): PeerSession {
    const session: PeerSession = {
      sessionId: generateUUID(),
      bleId,
      state: 'discovering',
      features: [],
      createdAt: Date.now(),
    };

    this.sessions.set(bleId, session);
    this.handshakeStages.set(session.sessionId, 'none');
    this.notifyListeners();

    logger.info('CONNECTION', `Session created for ${bleId}: ${session.sessionId}`);
    return session;
  }

  /**
   * Get an existing session by BLE ID.
   */
  getSession(bleId: string): PeerSession | undefined {
    return this.sessions.get(bleId);
  }

  /**
   * Get a session by peer user ID.
   */
  getSessionByUserId(userId: string): PeerSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.peerUserId === userId) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Get all active sessions.
   */
  getAllSessions(): PeerSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get sessions that are in 'ready' state.
   */
  getReadySessions(): PeerSession[] {
    return this.getAllSessions().filter(s => s.state === 'ready');
  }

  /**
   * Update session state.
   */
  updateState(bleId: string, state: ConnectionState, error?: string): void {
    const session = this.sessions.get(bleId);
    if (!session) return;

    session.state = state;
    session.lastActivityAt = Date.now();
    session.errorMessage = error;

    if (state === 'connected') {
      session.connectedAt = Date.now();
    }

    this.notifyListeners();
    logger.info('CONNECTION', `Session ${bleId} state: ${state}`);
  }

  /**
   * Update session with peer identity from handshake.
   */
  updatePeerIdentity(
    bleId: string,
    userId: string,
    displayName: string,
    publicKey?: string,
    protocolVersion?: number,
  ): void {
    const session = this.sessions.get(bleId);
    if (!session) return;

    session.peerUserId = userId;
    session.peerDisplayName = displayName;
    session.peerPublicKey = publicKey;
    session.peerProtocolVersion = protocolVersion;
    session.lastActivityAt = Date.now();

    this.notifyListeners();
    logger.info('CONNECTION', `Peer identity received: ${displayName} (${userId})`);
  }

  /**
   * Update session with peer capabilities.
   */
  updatePeerCapabilities(bleId: string, features: string[]): void {
    const session = this.sessions.get(bleId);
    if (!session) return;

    session.features = features;
    session.lastActivityAt = Date.now();

    this.notifyListeners();
    logger.info('CONNECTION', `Peer capabilities: ${features.join(', ')}`);
  }

  /**
   * Get/set handshake stage.
   */
  getHandshakeStage(sessionId: string): HandshakeStage {
    return this.handshakeStages.get(sessionId) ?? 'none';
  }

  setHandshakeStage(sessionId: string, stage: HandshakeStage): void {
    this.handshakeStages.set(sessionId, stage);
    logger.debug('PROTOCOL', `Handshake stage: ${stage}`);
  }

  /**
   * Remove a session.
   */
  removeSession(bleId: string): void {
    const session = this.sessions.get(bleId);
    if (session) {
      this.handshakeStages.delete(session.sessionId);
      this.sessions.delete(bleId);
      this.notifyListeners();
      logger.info('CONNECTION', `Session removed: ${bleId}`);
    }
  }

  /**
   * Mark activity on a session.
   */
  touch(bleId: string): void {
    const session = this.sessions.get(bleId);
    if (session) {
      session.lastActivityAt = Date.now();
    }
  }

  /**
   * Subscribe to session changes.
   */
  subscribe(callback: (sessions: PeerSession[]) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Clear all sessions.
   */
  clear(): void {
    this.sessions.clear();
    this.handshakeStages.clear();
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const sessions = this.getAllSessions();
    for (const listener of this.listeners) {
      try {
        listener(sessions);
      } catch (e) {
        logger.error('CONNECTION', 'Session listener error', e);
      }
    }
  }
}

export const sessionManager = new SessionManager();
