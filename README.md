# ZenChat

> Offline Peer-to-Peer Mobile Communication App built with React Native 0.87 (React 19).

ZenChat is a commercial-grade, private mobile application that allows nearby users to communicate directly using **Bluetooth Low Energy (BLE)** without requiring internet access, cloud servers, phone numbers, or user accounts.

---

## 🌟 Key Capabilities

- **Zero-Server Architecture**: True offline direct device-to-device transport.
- **Dual BLE Roles**: Simultaneous Central (Scanning/Connecting) and Peripheral (Advertising/GATT Server).
- **Cryptographic & QR Identity**: Human-verified local identities via QR code pairing without central authority.
- **Reliable Packet Protocol (`LOCAL_LINK v1`)**:
  - Full handshake flow: `HELLO` → `IDENTITY` → `CAPABILITIES` → `READY`
  - Automated message acknowledgements (`CHAT_ACK`) and delivery states (`pending` → `sending` → `sent` → `delivered` → `read`)
  - MTU-safe chunk fragmentation and sequential reassembly for large payloads
  - LRU cache packet deduplication
- **Offline Message Queue**: Automatic retry with exponential backoff and connection-triggered flush.
- **Developer Tools**:
  - **Packet Lab**: Live JSON packet composer with schema presets, validation, and transmission log.
  - **Diagnostics**: Real-time BLE adapter, session telemetry, loopback test, and system health status.
- **Restrained Premium Aesthetic**: Custom dark/light mode design system built on an 8pt grid with semantic tokens.

---

## 📱 Tech Stack

- **Framework**: React Native 0.87.1 (React 19, New Architecture)
- **BLE Transport**: `munim-bluetooth` (Nitro Modules)
- **Local Persistence**: `@op-engineering/op-sqlite` (parameterized SQL) + `react-native-mmkv`
- **State Management**: Zustand
- **Graphics & QR**: `@shopify/react-native-skia` + `react-native-qrcode-skia` + `react-native-svg`
- **Navigation**: React Navigation (Native Stack + Bottom Tabs)

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Type Verification
```bash
npm run typecheck
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Launch on Android
```bash
npx react-native run-android
```

### 5. Launch on iOS
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

---

## 📚 Documentation

- [Architecture Overview](file:///c:/xampp/htdocs/codes/zenchat/ARCHITECTURE.md)
- [BLE Protocol & GATT Profile](file:///c:/xampp/htdocs/codes/zenchat/BLE_PROTOCOL.md)
- [Packet Protocol Schemas](file:///c:/xampp/htdocs/codes/zenchat/PACKET_PROTOCOL.md)
- [Development Guide](file:///c:/xampp/htdocs/codes/zenchat/DEVELOPMENT.md)
- [Testing Strategy & Physical Matrix](file:///c:/xampp/htdocs/codes/zenchat/TESTING.md)
- [Troubleshooting](file:///c:/xampp/htdocs/codes/zenchat/TROUBLESHOOTING.md)

---

## 📄 License
MIT
