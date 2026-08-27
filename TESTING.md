# ZenChat — Testing Strategy & Validation Matrix

## 1. Automated Test Suites

Run the test suite with:
```bash
npm test
```

### Covered Test Areas:
1. **Identity & QR Encoding (`__tests__/identity.test.ts`)**:
   - Local identity creation and display name updates
   - QR payload schema generation
   - QR parsing and tamper rejection

2. **Protocol & Serialization (`__tests__/protocol.test.ts`)**:
   - `HELLO`, `IDENTITY`, `CAPABILITIES`, `CHAT_MESSAGE`, `CHAT_ACK`, `PING`, `PONG` packet constructors
   - Serialization to byte arrays and back without loss
   - Validation pipeline, protocol enforcement, and version mismatch checks

3. **MTU Chunking & Deduplication (`__tests__/chunking.test.ts`)**:
   - Fragmentation of oversized packets into MTU-safe chunk slices
   - Sequential reassembly of chunks into complete payloads
   - LRU cache deduplication preventing packet retransmission duplicates

4. **Offline Message Queue (`__tests__/chatQueue.test.ts`)**:
   - Offline message enqueueing when peer is disconnected
   - Exponential backoff retry calculations
   - Automatic queue flush when peer reaches `ready` state

5. **Cryptographic Identity (`__tests__/crypto.test.ts`)**:
   - Deterministic SHA-256 computation
   - Unique keypair generation
   - Digital signature generation and verification

---

## 2. Physical Device Validation Matrix

| Test Scenario | Status | Notes |
|---|---|---|
| Android BLE Advertising | Implemented | Requires physical Android device with BLE peripheral support |
| Android BLE Scanning | Implemented | Uses Android 12+ `BLUETOOTH_SCAN` permissions |
| iOS BLE Advertising | Implemented | Uses CoreBluetooth peripheral mode |
| iOS BLE Scanning | Implemented | Filtered by Service UUID |
| Android ↔ Android Handshake | Implemented | Requires 2 physical Android devices |
| iOS ↔ iOS Handshake | Implemented | Requires 2 physical iPhones |
| iOS ↔ Android Handshake | Implemented | Cross-platform GATT Central/Peripheral test |
| Background BLE Recovery | Implemented | Android foreground service / iOS CoreBluetooth state restoration |
| QR Code Camera Recognition | Implemented | Uses VisionCamera with fallback to manual paste |
