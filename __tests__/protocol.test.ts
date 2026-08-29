import {
  createMessagePacket,
  serializePacket,
  parseAndValidatePacket,
  MAX_MESSAGE_LENGTH,
  MessagePacket,
} from '../src/protocol/MessagePacket';

describe('MessagePacket Protocol', () => {
  it('creates a valid message packet with required fields', () => {
    const packet = createMessagePacket({
      senderId: 'A7F29C',
      senderName: 'Alex',
      receiverId: 'J19D20',
      text: 'Hello Jordan!',
    });

    expect(packet.type).toBe('MESSAGE');
    expect(packet.senderId).toBe('A7F29C');
    expect(packet.senderName).toBe('Alex');
    expect(packet.receiverId).toBe('J19D20');
    expect(packet.text).toBe('Hello Jordan!');
    expect(packet.packetId).toBeTruthy();
    expect(typeof packet.timestamp).toBe('number');
    expect(packet.timestamp).toBeGreaterThan(0);
  });

  it('serializes and deserializes a packet without loss', () => {
    const original = createMessagePacket({
      senderId: 'A7F29C',
      senderName: 'Alex',
      receiverId: 'J19D20',
      text: 'Test direct 1-to-1 packet',
    });

    const serialized = serializePacket(original);
    expect(typeof serialized).toBe('string');

    const deserialized = parseAndValidatePacket(serialized);
    expect(deserialized).not.toBeNull();
    expect(deserialized).toEqual(original);
  });

  it('safely rejects invalid JSON or malformed structures without throwing', () => {
    expect(parseAndValidatePacket('not json')).toBeNull();
    expect(parseAndValidatePacket('')).toBeNull();
    expect(parseAndValidatePacket(null)).toBeNull();
    expect(parseAndValidatePacket({})).toBeNull();
    expect(parseAndValidatePacket({ type: 'OTHER' })).toBeNull();
  });

  it('safely rejects packets with missing or empty required fields', () => {
    const basePacket: MessagePacket = {
      type: 'MESSAGE',
      packetId: 'pid123',
      senderId: 'A7F29C',
      senderName: 'Alex',
      receiverId: 'J19D20',
      text: 'Hello!',
      timestamp: Date.now(),
    };

    // Missing packetId
    expect(parseAndValidatePacket({ ...basePacket, packetId: '' })).toBeNull();

    // Missing senderId
    expect(parseAndValidatePacket({ ...basePacket, senderId: '   ' })).toBeNull();

    // Missing senderName
    expect(parseAndValidatePacket({ ...basePacket, senderName: '' })).toBeNull();

    // Missing receiverId
    expect(parseAndValidatePacket({ ...basePacket, receiverId: '' })).toBeNull();

    // Empty text or whitespace text
    expect(parseAndValidatePacket({ ...basePacket, text: '   ' })).toBeNull();

    // Invalid timestamp
    expect(parseAndValidatePacket({ ...basePacket, timestamp: -5 })).toBeNull();
    expect(parseAndValidatePacket({ ...basePacket, timestamp: NaN })).toBeNull();
  });

  it('safely rejects messages that exceed character limits', () => {
    const tooLongText = 'A'.repeat(MAX_MESSAGE_LENGTH + 1);
    const packet = {
      type: 'MESSAGE',
      packetId: 'pid123',
      senderId: 'A7F29C',
      senderName: 'Alex',
      receiverId: 'J19D20',
      text: tooLongText,
      timestamp: Date.now(),
    };

    expect(parseAndValidatePacket(packet)).toBeNull();
  });
});
