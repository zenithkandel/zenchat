/**
 * ZenChat Protocol — Packet Serializer
 *
 * Handles JSON serialization/deserialization of packets.
 * Converts between AppPacket objects and raw byte arrays for BLE transport.
 */

import type { AppPacket } from '../packets/types';

const TEXT_ENCODER = {
  encode(str: string): Uint8Array {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i);
    }
    return arr;
  },
};

const TEXT_DECODER = {
  decode(arr: Uint8Array): string {
    let str = '';
    for (let i = 0; i < arr.length; i++) {
      str += String.fromCharCode(arr[i]);
    }
    return str;
  },
};

export interface SerializationResult {
  success: boolean;
  data?: Uint8Array;
  json?: string;
  error?: string;
}

export interface DeserializationResult {
  success: boolean;
  packet?: AppPacket;
  error?: string;
}

/**
 * Serialize an AppPacket to a JSON string.
 */
export function serializePacket(packet: AppPacket): SerializationResult {
  try {
    const json = JSON.stringify(packet);
    const data = TEXT_ENCODER.encode(json);
    return { success: true, data, json };
  } catch (err) {
    return {
      success: false,
      error: `Serialization failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Deserialize a JSON string to an AppPacket.
 */
export function deserializePacket(data: Uint8Array | string): DeserializationResult {
  try {
    const json = typeof data === 'string' ? data : TEXT_DECODER.decode(data);
    const parsed = JSON.parse(json) as AppPacket;
    return { success: true, packet: parsed };
  } catch (err) {
    return {
      success: false,
      error: `Deserialization failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Calculate the byte size of a serialized packet.
 */
export function getPacketSize(packet: AppPacket): number {
  try {
    return JSON.stringify(packet).length;
  } catch {
    return 0;
  }
}

/**
 * Format byte size for human display.
 */
export function formatByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
