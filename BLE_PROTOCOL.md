# ZenChat — BLE Protocol & Transport Specification

## 1. BLE GATT Profile

All ZenChat devices operate concurrently as Central (Scanner/Client) and Peripheral (Advertiser/Server).

### Service & Characteristic UUIDs
- **Primary Service UUID**: `8C2D4F6E-A1B3-4E5F-9D7C-2B8A0F3E6D9C`
- **RX Characteristic UUID**: `8C2D4F6E-A1B3-4E5F-9D7C-2B8A0F3E6D9D` (Write / WriteWithoutResponse)
- **TX Characteristic UUID**: `8C2D4F6E-A1B3-4E5F-9D7C-2B8A0F3E6D9E` (Read / Notify)
- **Control Characteristic UUID**: `8C2D4F6E-A1B3-4E5F-9D7C-2B8A0F3E6D9F`

### Advertising Format
- Service UUID in advertisement packet for hardware filtering.
- Local Name format: `ZenChat:<DisplayName>` (truncated to 28 bytes for standard BLE advertisement payload safety).

---

## 2. Peer-to-Peer Handshake Flow

```text
DEVICE A (Initiator)                                 DEVICE B (Responder)
   │                                                    │
   │─── BLE Connect & Subscribe to TX ─────────────────►│
   │                                                    │
   │─── HELLO (version 1) ─────────────────────────────►│
   │                                                    │
   │◄── IDENTITY (userId, displayName, publicKey) ──────│
   │                                                    │
   │─── CAPABILITIES (chat, json, qr, chunking) ───────►│
   │                                                    │
   │◄── READY ──────────────────────────────────────────│
   │                                                    │
   │    ================ SESSION ACTIVE ================
   │                                                    │
   │─── CHAT_MESSAGE (packetId: P1, text) ─────────────►│
   │◄── CHAT_ACK (ackPacketId: P1) ─────────────────────│
   │                                                    │
   │─── PING ──────────────────────────────────────────►│
   │◄── PONG (echo) ────────────────────────────────────│
```

---

## 3. MTU Fragmentation & Chunking

For payloads exceeding MTU limits (512 bytes), packets are sliced into `CHUNK` envelopes:
- `transferId`: Unique ID grouping all chunk fragments.
- `chunkIndex`: Zero-based chunk counter (0...N-1).
- `totalChunks`: Total chunk count.
- `data`: Base64 slice of serialized JSON payload.
Reassembly occurs in memory with a 30-second staleness timeout.

---

## 4. Physical Device Testing Matrix

*Note: BLE requires physical hardware. Emulators/Simulators do not support BLE peripheral advertising or central scanning.*

- [x] Implemented: Protocol state machine, serialization, validation, chunking, deduplication.
- [ ] Physical Validation Required:
  - Android (Physical) <-> Android (Physical)
  - iOS (Physical) <-> iOS (Physical)
  - iOS (Physical) <-> Android (Physical)
