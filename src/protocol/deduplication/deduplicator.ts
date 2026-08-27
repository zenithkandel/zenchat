/**
 * ZenChat Protocol — Deduplication
 *
 * Bounded LRU cache of recently processed packet IDs.
 * Prevents duplicate processing of retransmitted packets.
 */

const DEFAULT_CAPACITY = 500;

export class PacketDeduplicator {
  private seen: Map<string, number> = new Map();
  private readonly capacity: number;

  constructor(capacity: number = DEFAULT_CAPACITY) {
    this.capacity = capacity;
  }

  /**
   * Check if a packet has already been processed.
   * Returns true if the packet is a duplicate.
   * If not a duplicate, records the packetId.
   */
  isDuplicate(packetId: string): boolean {
    if (this.seen.has(packetId)) {
      return true;
    }

    // Evict oldest entries if at capacity
    if (this.seen.size >= this.capacity) {
      const firstKey = this.seen.keys().next().value;
      if (firstKey !== undefined) {
        this.seen.delete(firstKey);
      }
    }

    this.seen.set(packetId, Date.now());
    return false;
  }

  /**
   * Manually mark a packetId as seen.
   */
  markSeen(packetId: string): void {
    if (this.seen.size >= this.capacity) {
      const firstKey = this.seen.keys().next().value;
      if (firstKey !== undefined) {
        this.seen.delete(firstKey);
      }
    }
    this.seen.set(packetId, Date.now());
  }

  /**
   * Check if a packetId has been seen without recording it.
   */
  hasSeen(packetId: string): boolean {
    return this.seen.has(packetId);
  }

  /**
   * Get the number of tracked packet IDs.
   */
  get size(): number {
    return this.seen.size;
  }

  /**
   * Clear all recorded packet IDs.
   */
  clear(): void {
    this.seen.clear();
  }
}
