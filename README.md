# ZENCHAT ⚡

> **Minimal Nearby Device Discovery + One-to-One Message Sending**
> Pure 1-Hop Bluetooth Low Energy • Black & White Neo-Brutalism • Expo & TypeScript

ZenChat is a minimal mobile application designed to discover nearby people and send direct text messages directly between devices without using the internet, servers, accounts, or databases.

---

## 🎯 The Core Flow

```
OPEN APP  →  SEE NEARBY PEOPLE  →  TAP PERSON  →  WRITE MESSAGE  →  SEND  →  RECIPIENT SEES MESSAGE
```

- **Zero Servers**: No Firebase, Supabase, REST APIs, or WebSockets.
- **Zero Accounts**: No phone numbers, emails, or passwords.
- **Zero History**: No inbox, message threads, databases, or SQLite.
- **Direct 1-Hop**: No mesh forwarding, relays, or multi-hop routing.
- **Pure Neo-Brutalism**: High contrast `#000000` / `#FFFFFF` / `#F7F7F3`, thick black borders, tactile hard offset shadows, bold typography.

---

## 🚀 Running in Expo Go (UI & Mock Mode)

Standard Expo Go is used for rapid UI development, navigation testing, keyboard interactions, and simulation.

```bash
# 1. Install dependencies
npm install

# 2. Start Expo development server
npm run start
```

### Mock Transport Features in Expo Go:
- Discovers simulated nearby peers: **Jordan** (`J19D20`), **Sam** (`S44E11`), and **Alex** (`A7F29C`).
- Pull down to refresh or tap the refresh icon to test the searching state.
- Tap a peer and send a message to test the tactile send button and delivery feedback.
- Tap **`+ TEST MSG`** or send a message to trigger an incoming message modal preview.

---

## 📱 Native Development Build (Real Hardware BLE)

To test real physical device-to-device Bluetooth Low Energy communication between iPhones and Android devices, generate an Expo Development Build:

```bash
# Install EAS CLI globally if needed
npm install -g eas-cli

# Prebuild native directories
npx expo prebuild

# Run locally on Android
npx expo run:android

# Run locally on iOS
npx expo run:ios
```

### Bluetooth Permissions (Preconfigured in `app.json`):
- **Android**: `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`.
- **iOS**: `NSBluetoothAlwaysUsageDescription`, `NSBluetoothPeripheralUsageDescription`.

---

## 🔬 Protocol & Packet Specification

ZenChat uses a single application packet payload:

```ts
type MessagePacket = {
  type: 'MESSAGE';
  packetId: string;       // Unique random alphanumeric ID
  senderId: string;       // 6-character hex ID (e.g. A7F29C)
  senderName: string;     // Display name (e.g. Alex)
  receiverId: string;     // Recipient 6-char ID
  text: string;           // Message string (max 500 chars)
  timestamp: number;      // Unix timestamp
};
```

---

## 🧪 Testing

Run the automated test suite:

```bash
npm test
```

Includes test coverage for:
- 6-character uppercase user ID generation & AsyncStorage persistence.
- JSON packet serialization, deserialization, and strict schema validation.
- Safe rejection of malformed or corrupted BLE packets without crashing.
- Mock transport discovery and listener subscriptions.

---

## ⚠️ Known Limitations & Design Constraints

1. **Foreground Operation**: ZenChat is designed for real-time foreground communication when both users have the app open.
2. **Range**: Dependent on physical Bluetooth Low Energy hardware range (typically 10–30 meters line of sight).
3. **No Encryption**: This version is a proof-of-concept for direct 1-to-1 transmission and does not include end-to-end cryptographic encryption.
