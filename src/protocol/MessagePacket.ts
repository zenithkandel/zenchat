export type MessagePacket = {
  type: 'MESSAGE';
  packetId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  timestamp: number;
};

export const MAX_MESSAGE_LENGTH = 500;

export function createMessagePacket(params: {
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
}): MessagePacket {
  const packetId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  return {
    type: 'MESSAGE',
    packetId,
    senderId: params.senderId.trim(),
    senderName: params.senderName.trim(),
    receiverId: params.receiverId.trim(),
    text: params.text.trim(),
    timestamp: Date.now(),
  };
}

export function serializePacket(packet: MessagePacket): string {
  return JSON.stringify(packet);
}

export function parseAndValidatePacket(raw: string | unknown): MessagePacket | null {
  try {
    let parsed: any = raw;
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw);
    }

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (parsed.type !== 'MESSAGE') {
      return null;
    }

    if (typeof parsed.packetId !== 'string' || !parsed.packetId.trim()) {
      return null;
    }

    if (typeof parsed.senderId !== 'string' || !parsed.senderId.trim()) {
      return null;
    }

    if (typeof parsed.senderName !== 'string' || !parsed.senderName.trim()) {
      return null;
    }

    if (typeof parsed.receiverId !== 'string' || !parsed.receiverId.trim()) {
      return null;
    }

    if (typeof parsed.text !== 'string' || !parsed.text.trim() || parsed.text.length > MAX_MESSAGE_LENGTH) {
      return null;
    }

    if (typeof parsed.timestamp !== 'number' || isNaN(parsed.timestamp) || parsed.timestamp <= 0) {
      return null;
    }

    return {
      type: 'MESSAGE',
      packetId: parsed.packetId,
      senderId: parsed.senderId,
      senderName: parsed.senderName,
      receiverId: parsed.receiverId,
      text: parsed.text,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}
