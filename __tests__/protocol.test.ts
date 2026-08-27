import {
  createHello,
  createIdentity,
  createCapabilities,
  createPing,
  createPong,
  createChatMessage,
  createChatAck,
} from '../src/protocol/packets/factory';
import { serializePacket, deserializePacket } from '../src/protocol/serializers/packetSerializer';
import { validatePacket } from '../src/protocol/validators/packetValidator';
import { PROTOCOL_NAME, PROTOCOL_VERSION } from '../src/protocol/packets/types';

describe('Packet Protocol & Validation Pipeline', () => {
  const senderId = 'user-123';
  const sessionId = 'session-456';
  const receiverId = 'user-789';

  test('creates a valid HELLO packet', () => {
    const packet = createHello(senderId, sessionId);
    expect(packet.protocol).toBe(PROTOCOL_NAME);
    expect(packet.version).toBe(PROTOCOL_VERSION);
    expect(packet.type).toBe('HELLO');
    expect(packet.payload.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(validatePacket(packet).valid).toBe(true);
  });

  test('creates and validates IDENTITY packet', () => {
    const packet = createIdentity(senderId, sessionId, 'Jordan', 'pk_12345');
    expect(packet.type).toBe('IDENTITY');
    expect(packet.payload.displayName).toBe('Jordan');
    const result = validatePacket(packet);
    expect(result.valid).toBe(true);
  });

  test('creates and validates CHAT_MESSAGE packet', () => {
    const packet = createChatMessage(senderId, sessionId, 'Hello offline world!', receiverId);
    expect(packet.type).toBe('CHAT_MESSAGE');
    expect(packet.payload.text).toBe('Hello offline world!');
    expect(validatePacket(packet).valid).toBe(true);
  });

  test('serializes and deserializes packets with zero data loss', () => {
    const original = createChatMessage(senderId, sessionId, 'Test serialization message', receiverId);
    const serialized = serializePacket(original);
    expect(serialized.success).toBe(true);
    expect(serialized.data).toBeDefined();

    const deserialized = deserializePacket(serialized.data!);
    expect(deserialized.success).toBe(true);
    expect(deserialized.packet?.packetId).toBe(original.packetId);
    expect(deserialized.packet?.type).toBe(original.type);
    expect((deserialized.packet?.payload as any).text).toBe('Test serialization message');
  });

  test('rejects invalid protocol and version mismatch', () => {
    const invalidProto = {
      protocol: 'FAKE_PROTOCOL',
      version: 1,
      packetId: 'uuid',
      sessionId: 'sess',
      type: 'PING',
      senderId: 'user',
      timestamp: Date.now(),
      payload: {},
    };
    expect(validatePacket(invalidProto).valid).toBe(false);

    const versionMismatch = {
      protocol: PROTOCOL_NAME,
      version: 999, // Future unsupported version
      packetId: 'uuid',
      sessionId: 'sess',
      type: 'PING',
      senderId: 'user',
      timestamp: Date.now(),
      payload: {},
    };
    expect(validatePacket(versionMismatch).valid).toBe(false);
  });
});
