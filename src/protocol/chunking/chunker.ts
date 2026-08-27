/**
 * ZenChat Protocol — Chunking System
 *
 * BLE payloads are constrained. This splits large packets into
 * numbered chunks for transmission and reassembles on the receiving end.
 */

import { generateUUID } from '../../utils/uuid';
import type { AppPacket, ChunkPayload } from '../packets/types';
import { PROTOCOL_NAME, PROTOCOL_VERSION } from '../packets/types';

/** Default MTU-safe chunk size (in bytes of base64 encoded data) */
const DEFAULT_CHUNK_SIZE = 512;

/**
 * Split a serialized packet into chunks if it exceeds the chunk size.
 * Returns an array of ChunkPackets, or the original data if small enough.
 */
export function chunkData(
  jsonString: string,
  senderId: string,
  sessionId: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): AppPacket<ChunkPayload>[] | null {
  // If the data fits in one chunk, no chunking needed
  if (jsonString.length <= chunkSize) {
    return null;
  }

  const transferId = generateUUID();
  const chunks: AppPacket<ChunkPayload>[] = [];
  const totalChunks = Math.ceil(jsonString.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, jsonString.length);
    const data = jsonString.slice(start, end);

    chunks.push({
      protocol: PROTOCOL_NAME,
      version: PROTOCOL_VERSION,
      packetId: generateUUID(),
      sessionId,
      type: 'CHUNK',
      senderId,
      timestamp: Date.now(),
      payload: {
        transferId,
        chunkIndex: i,
        totalChunks,
        data,
      },
    });
  }

  return chunks;
}

/**
 * Reassembles chunks back into the original JSON string.
 */
export class ChunkReassembler {
  private transfers: Map<string, {
    chunks: Map<number, string>;
    totalChunks: number;
    createdAt: number;
  }> = new Map();

  /** Timeout for incomplete transfers (30 seconds) */
  private readonly timeout = 30000;

  /**
   * Add a chunk and attempt reassembly.
   * Returns the complete JSON string when all chunks are received, null otherwise.
   */
  addChunk(payload: ChunkPayload): string | null {
    const { transferId, chunkIndex, totalChunks, data } = payload;

    let transfer = this.transfers.get(transferId);
    if (!transfer) {
      transfer = {
        chunks: new Map(),
        totalChunks,
        createdAt: Date.now(),
      };
      this.transfers.set(transferId, transfer);
    }

    // Validate consistency
    if (transfer.totalChunks !== totalChunks) {
      this.transfers.delete(transferId);
      return null;
    }

    transfer.chunks.set(chunkIndex, data);

    // Check if all chunks received
    if (transfer.chunks.size === totalChunks) {
      const parts: string[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const part = transfer.chunks.get(i);
        if (part === undefined) {
          // Missing chunk — shouldn't happen but guard against it
          return null;
        }
        parts.push(part);
      }

      this.transfers.delete(transferId);
      return parts.join('');
    }

    return null;
  }

  /**
   * Clean up stale incomplete transfers.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [id, transfer] of this.transfers) {
      if (now - transfer.createdAt > this.timeout) {
        this.transfers.delete(id);
      }
    }
  }

  /**
   * Get the number of pending incomplete transfers.
   */
  get pendingCount(): number {
    return this.transfers.size;
  }

  /**
   * Clear all pending transfers.
   */
  clear(): void {
    this.transfers.clear();
  }
}
