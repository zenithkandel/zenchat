# ZenChat — Architecture Documentation

## 1. Architectural Philosophy

ZenChat is built on the strict principle of **Zero External Infrastructure Dependency**:
- **No Backend**: No cloud servers, web sockets, or remote databases.
- **No Internet Requirement**: Direct peer-to-peer communication over Bluetooth Low Energy (BLE).
- **No Central Accounts**: User identities are generated and stored locally using display names and cryptographic keypairs.
- **Layered Clean Architecture**: UI -> Application/Hooks -> Domain Services -> Transport Abstraction -> Native BLE.

```text
┌────────────────────────────────────────────────────────┐
│                   React Native UI                      │
│ (Home, Nearby, Chat, Contacts, MyQR, ScanQR, Lab, Diag)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              Zustand Stores & State Hooks              │
│ (useIdentityStore, useBleStore, useNearbyStore, ...)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Application Services                  │
│ (IdentityService, ChatService, CryptoService, Repos)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 BLE Protocol Engine                    │
│ (Packet Validation, Serialization, Chunking, Handshake)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 Transport Abstraction                  │
│                     (Transport)                        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 BLE Implementation                     │
│         (munim-bluetooth Nitro Module)                 │
└────────────────────────────────────────────────────────┘
```

## 2. Directory Structure

- `src/app/navigation/`: Root stack, bottom tabs, modal navigators.
- `src/ble/`: BLE constants, session state machine, transport abstraction, permissions, protocol engine.
- `src/chat/`: ChatService, message queue with exponential backoff, offline queues.
- `src/components/`: Reusable design system components (Avatar, PeerCard, ConnectionBadge, QRCard, EmptyState, MessageBubble).
- `src/crypto/`: Offline cryptographic key generation, SHA-256 hashing, digital signatures.
- `src/identity/`: Identity service, QR payload encoding/decoding/validation, MMKV persistence.
- `src/protocol/`: Packet definitions, factories, presets, serializer, validator, chunker, deduplicator.
- `src/screens/`: Feature screens (Onboarding, Home, Nearby, Chats, Chat, ContactDetails, MyQR, ScanQR, Diagnostics, PacketLab, Settings).
- `src/state/`: Zustand stores for reactive state management.
- `src/storage/`: SQLite database setup, migrations, repositories (users, contacts, conversations, messages, packet_log).
- `src/theme/`: Semantic colors, typography, spacing (8pt grid), radii, shadows, ThemeProvider.
- `src/utils/`: Logger, error types, UUID generator.
