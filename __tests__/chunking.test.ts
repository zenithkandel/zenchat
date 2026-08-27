import { chunkData, ChunkReassembler } from '../src/protocol/chunking/chunker';
import { PacketDeduplicator } from '../src/protocol/deduplication/deduplicator';

describe('Packet Chunking & Deduplication', () => {
  test('does not chunk small packets under chunk size', () => {
    const smallPayload = JSON.stringify({ message: 'short string' });
    const chunks = chunkData(smallPayload, 'sender', 'session', 512);
    expect(chunks).toBeNull();
  });

  test('chunks and reassembles large payload accurately', () => {
    // 2KB payload
    const largePayload = 'A'.repeat(2048);
    const chunkSize = 256;
    const chunks = chunkData(largePayload, 'sender-1', 'session-1', chunkSize);

    expect(chunks).not.toBeNull();
    expect(chunks?.length).toBe(8);

    const reassembler = new ChunkReassembler();
    let reassembled: string | null = null;

    for (const chunk of chunks!) {
      reassembled = reassembler.addChunk(chunk.payload);
    }

    expect(reassembled).toBe(largePayload);
    expect(reassembled?.length).toBe(2048);
  });

  test('deduplicator prevents double-processing of identical packets', () => {
    const deduplicator = new PacketDeduplicator(100);
    const packetId = 'packet-uuid-1234';

    expect(deduplicator.isDuplicate(packetId)).toBe(false); // First time seen
    expect(deduplicator.isDuplicate(packetId)).toBe(true);  // Duplicate!
    expect(deduplicator.hasSeen(packetId)).toBe(true);
  });
});
