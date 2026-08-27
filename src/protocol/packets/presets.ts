/**
 * ZenChat Protocol — Packet Presets
 *
 * JSON presets for Packet Lab UI.
 * These are display templates — actual sending uses the packet factory.
 */

export interface PacketPreset {
  name: string;
  type: string;
  description: string;
  json: Record<string, unknown>;
}

export const PACKET_PRESETS: PacketPreset[] = [
  {
    name: 'HELLO',
    type: 'HELLO',
    description: 'Initial handshake greeting',
    json: {
      protocol: 'LOCAL_LINK',
      version: 1,
      type: 'HELLO',
    },
  },
  {
    name: 'PING',
    type: 'PING',
    description: 'Connectivity test request',
    json: {
      type: 'PING',
      message: 'hello',
    },
  },
  {
    name: 'PONG',
    type: 'PONG',
    description: 'Connectivity test response',
    json: {
      type: 'PONG',
      message: 'hello',
    },
  },
  {
    name: 'IDENTITY',
    type: 'IDENTITY',
    description: 'User identity exchange',
    json: {
      type: 'IDENTITY',
      userId: '',
      displayName: '',
    },
  },
  {
    name: 'CAPABILITIES',
    type: 'CAPABILITIES',
    description: 'Feature negotiation',
    json: {
      type: 'CAPABILITIES',
      features: ['chat', 'json', 'qr-identity', 'chunking'],
    },
  },
  {
    name: 'CHAT_MESSAGE',
    type: 'CHAT_MESSAGE',
    description: 'Send a chat message',
    json: {
      type: 'CHAT_MESSAGE',
      text: 'Hello!',
    },
  },
  {
    name: 'JSON_REQUEST',
    type: 'JSON_REQUEST',
    description: 'Custom JSON request',
    json: {
      type: 'JSON_REQUEST',
      action: 'example',
      data: {},
    },
  },
  {
    name: 'JSON_RESPONSE',
    type: 'JSON_RESPONSE',
    description: 'Custom JSON response',
    json: {
      type: 'JSON_RESPONSE',
      success: true,
      data: {},
    },
  },
  {
    name: 'ERROR',
    type: 'ERROR',
    description: 'Error notification',
    json: {
      type: 'ERROR',
      code: 'INVALID_PACKET',
      message: 'Packet could not be processed',
    },
  },
];
