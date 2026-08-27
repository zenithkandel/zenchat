# ZenChat — Packet Protocol Specification (LOCAL_LINK v1)

## 1. Unified Packet Envelope

Every packet transmitted over the physical transport conforms to the `AppPacket` envelope:

```typescript
export interface AppPacket<T = unknown> {
  protocol: 'LOCAL_LINK';
  version: 1;
  packetId: string;      // UUID v4
  sessionId: string;     // Unique handshake session ID
  type: PacketType;
  senderId: string;      // Local user ID
  receiverId?: string;   // Recipient user ID
  timestamp: number;     // Unix milliseconds
  payload: T;
}
```

---

## 2. Core Packet Types & Schemas

### 1. `HELLO`
Initiates connection handshake.
```json
{
  "protocol": "LOCAL_LINK",
  "version": 1,
  "packetId": "d5a2...",
  "sessionId": "sess-1",
  "type": "HELLO",
  "senderId": "user-a",
  "timestamp": 1724760000000,
  "payload": {
    "protocolVersion": 1
  }
}
```

### 2. `IDENTITY`
Exchanges user display name and cryptographic public key.
```json
{
  "protocol": "LOCAL_LINK",
  "version": 1,
  "packetId": "e1f3...",
  "sessionId": "sess-1",
  "type": "IDENTITY",
  "senderId": "user-a",
  "timestamp": 1724760000100,
  "payload": {
    "userId": "user-a",
    "displayName": "Alex",
    "publicKey": "04a1b2...",
    "protocolVersion": 1
  }
}
```

### 3. `CAPABILITIES`
Declares supported application features.
```json
{
  "protocol": "LOCAL_LINK",
  "version": 1,
  "packetId": "c4d5...",
  "sessionId": "sess-1",
  "type": "CAPABILITIES",
  "senderId": "user-a",
  "timestamp": 1724760000200,
  "payload": {
    "features": ["chat", "json", "qr-identity", "chunking"]
  }
}
```

### 4. `CHAT_MESSAGE`
Carries an encrypted or plaintext offline chat message.
```json
{
  "protocol": "LOCAL_LINK",
  "version": 1,
  "packetId": "msg-99...",
  "sessionId": "sess-1",
  "type": "CHAT_MESSAGE",
  "senderId": "user-a",
  "receiverId": "user-b",
  "timestamp": 1724760000500,
  "payload": {
    "text": "Hello from nearby!",
    "sequenceNumber": 1
  }
}
```

### 5. `CHAT_ACK`
Confirms delivery of a chat message packet.
```json
{
  "protocol": "LOCAL_LINK",
  "version": 1,
  "packetId": "ack-11...",
  "sessionId": "sess-1",
  "type": "CHAT_ACK",
  "senderId": "user-b",
  "receiverId": "user-a",
  "timestamp": 1724760000550,
  "payload": {
    "ackPacketId": "msg-99..."
  }
}
```

### 6. `PING` / `PONG`
Diagnostic round-trip connectivity test.
```json
{
  "protocol": "LOCAL_LINK",
  "version": 1,
  "packetId": "ping-01...",
  "sessionId": "sess-1",
  "type": "PING",
  "senderId": "user-a",
  "timestamp": 1724760000800,
  "payload": {
    "message": "ping"
  }
}
```
```json
{
  "protocol": "LOCAL_LINK",
  "version": 1,
  "packetId": "pong-01...",
  "sessionId": "sess-1",
  "type": "PONG",
  "senderId": "user-b",
  "timestamp": 1724760000850,
  "payload": {
    "message": "ping",
    "echoPacketId": "ping-01..."
  }
}
```

### 7. `CHUNK`
MTU fragment envelope for large payloads.
```json
{
  "protocol": "LOCAL_LINK",
  "version": 1,
  "packetId": "chunk-01...",
  "sessionId": "sess-1",
  "type": "CHUNK",
  "senderId": "user-a",
  "timestamp": 1724760001000,
  "payload": {
    "transferId": "trans-123",
    "chunkIndex": 0,
    "totalChunks": 4,
    "data": "eyJwcm90b2NvbCI6..."
  }
}
```
