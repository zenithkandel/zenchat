# MASTER BUILD SPECIFICATION

## Offline Peer-to-Peer Mobile Communication App

### React Native • iOS + Android • BLE • QR Identity • Offline Chat • JSON Packet Transport

You are the primary senior mobile architect, UX designer, React Native engineer, native iOS/Android engineer, and QA engineer for this project.

Your job is to BUILD the application, not merely propose an architecture.

Do not stop at mock screens.

Do not create placeholder buttons that do nothing.

Do not build a fake BLE layer that only simulates communication.

Do not assume internet connectivity.

The end goal is a polished, premium React Native application that can run entirely locally/offline and communicate directly with nearby devices using Bluetooth Low Energy.

The application should feel like a carefully designed commercial product rather than a hackathon prototype.

---

# 1. CORE PRODUCT CONCEPT

Build a mobile application that allows nearby users to communicate directly with each other without:

* a backend server
* VPS
* Firebase
* Supabase
* REST APIs
* WebSockets over the internet
* authentication servers
* cloud databases
* internet access
* phone numbers
* email accounts

The application must operate primarily through local device-to-device communication.

The primary transport is BLE.

The application must support:

* iOS ↔ iOS
* Android ↔ Android
* iOS ↔ Android
* Android ↔ iOS

The application should support both:

1. structured JSON packet exchange
2. human-friendly offline chat

The same underlying communication engine should be reusable for both.

Think of the application as having two layers:

```text
┌────────────────────────────────────────────┐
│                 UI / UX                    │
│                                            │
│ Chat • Contacts • QR • Send • Receive      │
│ JSON • Settings • Connection Status        │
└────────────────────┬───────────────────────┘
                     │
┌────────────────────▼───────────────────────┐
│             APPLICATION LAYER              │
│                                            │
│ Messages • Packets • Identity • Sessions   │
│ Routing • Deduplication • ACKs • Queues    │
└────────────────────┬───────────────────────┘
                     │
┌────────────────────▼───────────────────────┐
│            TRANSPORT ABSTRACTION            │
│                                            │
│                 BLE                        │
│                                            │
│ Central + Peripheral                       │
│ Discovery + Connection + GATT              │
└────────────────────────────────────────────┘
```

The UI must never directly manipulate BLE primitives.

The BLE implementation must be hidden behind a clean transport service.

---

# 2. ABSOLUTE ARCHITECTURAL REQUIREMENT

DO NOT use `react-native-ble-plx` blindly as the entire communication solution.

Its current documented scope supports BLE scanning, connecting to peripherals, GATT services/characteristics, read/write/notifications, etc., but explicitly does not support communicating between phones as BLE peripherals.

Therefore:

1. Investigate the currently maintained React Native BLE options.
2. Verify whether they support:

   * central mode
   * peripheral mode
   * advertising
   * GATT server
   * characteristic write
   * characteristic notify/indicate
   * iOS
   * Android
   * New Architecture
   * RN 0.87 compatibility
3. Prefer an actively maintained solution.
4. If no sufficiently reliable cross-platform package exists, implement a thin custom native BLE bridge:

   * Swift/CoreBluetooth for iOS
   * Kotlin/Android Bluetooth APIs for Android
5. Expose a clean TypeScript interface to the JS layer.

Do NOT compromise the architecture merely to avoid writing native code.

A reliable application is more important than having 100% JavaScript.

The native BLE layer should expose methods conceptually similar to:

```ts
interface BleTransport {
  initialize(): Promise<void>;

  getBluetoothState(): Promise<BluetoothState>;

  startAdvertising(identity: AdvertisementIdentity): Promise<void>;

  stopAdvertising(): Promise<void>;

  startScanning(): Promise<void>;

  stopScanning(): Promise<void>;

  getDiscoveredPeers(): Promise<DiscoveredPeer[]>;

  connect(peerId: string): Promise<Connection>;

  disconnect(peerId: string): Promise<void>;

  send(packet: TransportPacket): Promise<void>;

  subscribeToPackets(
    callback: (packet: TransportPacket) => void
  ): Unsubscribe;

  subscribeToConnectionState(
    callback: (state: ConnectionStateEvent) => void
  ): Unsubscribe;
}
```

The exact API may differ based on the native implementation.

The key point is that the rest of the application must not care which BLE library is underneath.

---

# 3. TECHNOLOGY STACK

Use:

* React Native latest stable release appropriate for the environment
* TypeScript
* New Architecture
* Hermes
* React Navigation or Expo Router only if genuinely useful
* Zustand or another lightweight predictable state manager
* SQLite for durable structured application data
* MMKV or equivalent for tiny configuration values
* a modern QR/camera solution
* SVG-based icons
* Reanimated for purposeful animations
* React Native Gesture Handler if required

Current React Native is 0.87 as of this specification, so prefer the current stable RN ecosystem rather than starting with an old template.

Do not downgrade React Native merely because a random BLE package is old.

Instead, evaluate compatibility and solve the integration properly.

---

# 4. OFFLINE-FIRST PRINCIPLE

The application must behave as if there is no network.

Do not include:

```text
fetch()
axios()
Firebase
Supabase
GraphQL
Socket.io internet services
remote authentication
remote databases
analytics that require connectivity
```

unless explicitly needed for development tooling only.

There must be no dependency on:

```text
Internet
Wi-Fi internet
cellular data
DNS
cloud APIs
remote authentication
remote synchronization
```

The application should continue working when:

* Airplane Mode is enabled but Bluetooth is manually enabled
* Wi-Fi is unavailable
* cellular service is unavailable
* there is no internet connection
* the server does not exist
* the user is in an isolated environment

The application must clearly distinguish:

```text
Internet connectivity
```

from:

```text
Bluetooth connectivity
```

Never show "Offline" as meaning "the app is broken."

Offline is a normal operating mode.

---

# 5. USER ACCOUNT / SIGN-UP MODEL

There is NO traditional account system.

No:

* email
* password
* phone number
* OTP
* username availability checking
* server authentication

On first launch show:

## "Welcome"

Subtitle:

"Choose the name people nearby will see."

Input:

```text
Your name
[________________]
```

Button:

```text
Continue
```

The only mandatory user input is a display name.

After the user selects a name, generate a local identity.

The local identity should contain at least:

```ts
interface LocalIdentity {
  userId: string;
  displayName: string;
  createdAt: number;
  publicKey?: string;
  deviceLabel?: string;
  protocolVersion: number;
}
```

The `userId` must be randomly generated locally.

Do NOT use:

* phone number
* email
* device IMEI
* MAC address
* Bluetooth MAC address
* advertising hardware identifiers

as the application's user identity.

The user ID must survive application restarts.

The application should optionally generate a local public/private cryptographic identity if feasible.

Keep cryptographic identity separate from human display name.

The name is for humans.

The ID is for the protocol.

---

# 6. QR-BASED USER IDENTIFICATION

Implement QR identity exchange.

This exists primarily to solve one human problem:

"When I see several nearby devices, how do I know which one is the person I actually want?"

The QR code should identify a user's application identity.

Do not put sensitive unnecessary information into the QR code.

Suggested format:

```json
{
  "type": "USER_IDENTITY",
  "version": 1,
  "userId": "uuid",
  "displayName": "Alex",
  "publicKey": "...",
  "protocolVersion": 1
}
```

Encode this as a compact QR payload.

Prefer a compact string representation if the JSON becomes unnecessarily large.

The QR screen must support:

## My QR

Display:

```text
┌──────────────────────────┐
│                          │
│        QR CODE           │
│                          │
└──────────────────────────┘

Alex

Show this to someone
so they can identify you.
```

Provide:

* share
* enlarge
* copy identity
* regenerate identity only with a very explicit warning

Also provide:

## Scan QR

Use the camera to scan another user's identity.

After scanning:

```text
┌──────────────────────────────┐
│     Identity found           │
│                              │
│           👤                 │
│                              │
│         Alex                 │
│     ID •••• 9F4A             │
│                              │
│     [ Add contact ]          │
│                              │
│     [ Cancel ]               │
└──────────────────────────────┘
```

Do not automatically connect merely because a QR was scanned.

QR is identity discovery/confirmation.

BLE is communication.

---

# 7. CONTACT MODEL

Because there is no server, contacts must be stored locally.

A contact should look like:

```ts
interface Contact {
  userId: string;
  displayName: string;
  publicKey?: string;
  avatar?: string;
  addedAt: number;
  lastSeenAt?: number;
  lastKnownBleIdentifier?: string;
  trusted: boolean;
}
```

Allow:

* add via QR
* add from discovered peers
* rename locally
* remove contact
* block contact
* view identity
* open chat
* view last seen

A locally assigned nickname should not overwrite the user's actual remote display name unless the UI clearly labels it as a local nickname.

Example:

```text
Alex
"Alex from college"   ← optional local nickname
```

---

# 8. PEER DISCOVERY

The discovery system should work without the user manually opening Bluetooth settings.

The app should:

1. determine Bluetooth state
2. request required permissions
3. start BLE advertising
4. start BLE scanning where platform capabilities allow
5. discover compatible app peers
6. filter unrelated BLE devices
7. display app-compatible peers

Do not present a raw Bluetooth device list full of:

* headphones
* watches
* cars
* keyboards
* random BLE sensors

The application should filter using its own service UUID / protocol identifiers.

Use an application-specific BLE service UUID.

Define clear UUID constants such as:

```ts
BLE_SERVICE_UUID
BLE_RX_CHARACTERISTIC_UUID
BLE_TX_CHARACTERISTIC_UUID
BLE_CONTROL_CHARACTERISTIC_UUID
```

Do not hardcode UUID strings all over the codebase.

Centralize protocol constants.

---

# 9. DISCOVERY UX

Create a beautiful nearby screen.

Header:

```text
Nearby
```

Subtitle:

```text
People using this app nearby
```

Display a subtle scanning animation.

Example:

```text
             ◌
        scanning nearby

       3 people found
```

Peers should appear as elegant cards:

```text
┌────────────────────────────────┐
│  A                              │
│  Alex                           │
│                                 │
│  Nearby                         │
│  ● Strong connection            │
└────────────────────────────────┘
```

Do NOT show:

```text
UUID: 3f19eab...
MAC: 28:AA...
RSSI: -67
```

unless the user opens Developer / Diagnostics.

The normal UI should be human-centered.

---

# 10. PEER IDENTIFICATION

Discovery alone is not enough.

A nearby BLE device should be identified through:

1. app-specific BLE service
2. application handshake
3. protocol version
4. user identity
5. optional QR verification

After connection:

```text
HELLO
```

then:

```text
IDENTITY
```

then:

```text
CAPABILITIES
```

then:

```text
READY
```

The app should not trust a display name obtained from an arbitrary BLE device.

Only accept identity from a valid protocol handshake.

---

# 11. BLE CONNECTION ARCHITECTURE

Every device should conceptually be capable of:

```text
Central
+
Peripheral
```

because peer-to-peer communication requires two-sided discovery/communication.

Use a session abstraction:

```ts
interface PeerSession {
  sessionId: string;
  peerUserId: string;
  state:
    | 'disconnected'
    | 'discovering'
    | 'connecting'
    | 'connected'
    | 'disconnecting'
    | 'error';
  connectedAt?: number;
  lastActivityAt?: number;
}
```

The UI should not expose the technical distinction between Central and Peripheral.

It should simply say:

```text
Connecting...
Connected
```

---

# 12. PACKET PROTOCOL

Do NOT send arbitrary JSON with random shapes throughout the application.

Create ONE well-defined packet envelope.

Suggested:

```ts
interface AppPacket<T = unknown> {
  protocol: 'LOCAL_LINK';
  version: 1;
  packetId: string;
  sessionId: string;

  type:
    | 'HELLO'
    | 'IDENTITY'
    | 'CAPABILITIES'
    | 'PING'
    | 'PONG'
    | 'CHAT_MESSAGE'
    | 'CHAT_ACK'
    | 'DELIVERY_RECEIPT'
    | 'READ_RECEIPT'
    | 'TYPING'
    | 'JSON_REQUEST'
    | 'JSON_RESPONSE'
    | 'CONTACT_REQUEST'
    | 'CONTACT_RESPONSE'
    | 'DISCONNECT'
    | 'ERROR'
    | 'CHUNK';

  senderId: string;
  receiverId?: string;

  timestamp: number;

  payload: T;
}
```

Every packet must have a unique `packetId`.

Never use only timestamp as an identifier.

Use UUID/random IDs.

---

# 13. PRESET JSON PACKETS

Create a JSON Lab / Packet Lab screen.

Include presets:

### HELLO

```json
{
  "protocol": "LOCAL_LINK",
  "version": 1,
  "type": "HELLO"
}
```

### PING

```json
{
  "type": "PING",
  "timestamp": 0
}
```

### PONG

```json
{
  "type": "PONG",
  "timestamp": 0
}
```

### IDENTITY

```json
{
  "type": "IDENTITY",
  "userId": "",
  "displayName": ""
}
```

### CAPABILITIES

```json
{
  "type": "CAPABILITIES",
  "features": [
    "chat",
    "json",
    "qr-identity"
  ]
}
```

### CHAT_MESSAGE

```json
{
  "type": "CHAT_MESSAGE",
  "text": "Hello!"
}
```

### JSON_REQUEST

```json
{
  "type": "JSON_REQUEST",
  "action": "example",
  "data": {}
}
```

### JSON_RESPONSE

```json
{
  "type": "JSON_RESPONSE",
  "success": true,
  "data": {}
}
```

### ERROR

```json
{
  "type": "ERROR",
  "code": "INVALID_PACKET",
  "message": "Packet could not be processed"
}
```

The UI must allow users/developers to:

* choose preset
* edit JSON
* validate JSON
* send JSON
* see received JSON
* copy JSON
* format JSON
* reset JSON

---

# 14. CHAT FUNCTIONALITY

Build an offline chat experience inspired by the simplicity of modern messaging applications.

Do not copy the visual design of another product.

Create an original UI.

Chat must work without internet.

A message should initially be stored locally:

```text
pending
```

Then transmitted.

Then:

```text
sent
```

Then, if acknowledgement is received:

```text
delivered
```

Optionally:

```text
read
```

Message structure:

```ts
interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;

  text: string;

  timestamp: number;

  status:
    | 'pending'
    | 'sending'
    | 'sent'
    | 'delivered'
    | 'read'
    | 'failed';

  retryCount: number;
}
```

---

# 15. CHAT SCREEN

Design it to feel extremely clean.

Top:

```text
←    Alex
     ● Nearby
```

Message area:

```text
                 Hey!

      Hello 👋

                 Are you nearby?

Yes, I'm here.
```

Composer:

```text
[ + ]  Write a message...     [ ↑ ]
```

Use excellent spacing.

Avoid excessive borders.

Avoid huge shadows.

Avoid overly rounded "everything".

Avoid gradients everywhere.

Avoid cartoonish UI.

Avoid excessive animation.

The UI should feel expensive and intentional.

---

# 16. PRESENCE STATES

Use human-friendly connection states:

```text
Nearby
Connecting
Connected
Just now
Away
Unavailable
```

Do not expose technical states unless inside diagnostics.

Potential UI:

```text
● Nearby
```

or

```text
○ Connecting...
```

or

```text
— Not nearby
```

Use animation subtly.

---

# 17. CONNECTION FLOW

Suppose User A wants to communicate with User B.

Flow:

```text
Open app
     ↓
Nearby
     ↓
Find B
     ↓
Tap B
     ↓
Identity confirmation
     ↓
Connect
     ↓
Handshake
     ↓
Ready
     ↓
Chat
```

If QR was scanned:

```text
Scan B's QR
     ↓
Identity saved
     ↓
Find B via BLE
     ↓
Connect automatically
```

This should make identification reliable without requiring users to understand BLE.

---

# 18. AUTOMATIC CONNECTION

Once a trusted contact is selected, the app may attempt connection automatically.

The UI should not require users to:

* select a Bluetooth service
* choose a characteristic
* manually reconnect
* inspect technical errors

The app handles:

```text
scan
connect
discover services
subscribe notifications
handshake
send
receive
ack
disconnect
```

automatically.

---

# 19. MESSAGE QUEUE

Do not assume the BLE connection is always available.

Messages should be queued locally.

Example:

```text
User types message
        ↓
Store locally
        ↓
No connection
        ↓
status = pending
        ↓
Peer becomes available
        ↓
Send automatically
        ↓
ACK
        ↓
delivered
```

Retry intelligently.

Avoid infinite reconnect loops.

Use exponential backoff or another sensible retry policy.

---

# 20. DUPLICATE PROTECTION

Messages may potentially be retransmitted.

Every packet must have:

```text
packetId
```

Maintain a local record of recently processed packet IDs.

When a duplicate arrives:

```text
Do not display twice.
Do not process twice.
Do not perform the action twice.
```

For development, implement a bounded cache such as:

```text
last N packet IDs
```

or persistent deduplication where appropriate.

---

# 21. CHUNKING

BLE payloads can be constrained.

Do not assume the entire JSON packet will always fit into a single characteristic write.

Implement a transport-level chunking system.

Example:

```text
CHUNK 1/4
CHUNK 2/4
CHUNK 3/4
CHUNK 4/4
```

Conceptual structure:

```ts
interface ChunkPacket {
  type: 'CHUNK';
  transferId: string;
  chunkIndex: number;
  totalChunks: number;
  data: string;
}
```

The receiver reassembles the original payload.

After reconstruction:

```text
raw bytes
 ↓
decode
 ↓
JSON parse
 ↓
packet validation
```

Do not display partial transport chunks to the user.

---

# 22. PACKET VALIDATION

Every incoming packet must go through validation.

Pipeline:

```text
BLE bytes
    ↓
decode
    ↓
reassemble if required
    ↓
parse JSON
    ↓
schema validation
    ↓
protocol version check
    ↓
packet ID validation
    ↓
sender identity validation
    ↓
application handling
```

Malformed packets must never crash the app.

Return:

```text
INVALID_PACKET
```

and ignore safely.

---

# 23. SECURITY FOUNDATION

Even though there is no backend, do not assume the local wireless environment is trustworthy.

Design the protocol so cryptographic verification can be introduced.

At minimum:

* unique user ID
* unique packet ID
* session ID
* replay resistance
* duplicate detection
* schema validation
* sender identity
* message integrity

If practical, implement identity using locally generated public/private key pairs.

Do not invent cryptography.

Do not create custom encryption algorithms.

Use established cryptographic libraries/APIs if implementing cryptographic protection.

If full E2E encryption is implemented, keep it in a separate crypto service:

```ts
interface CryptoService {
  generateIdentity(): Promise<IdentityKeyPair>;

  sign(data: Uint8Array): Promise<Uint8Array>;

  verify(
    data: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean>;

  encrypt(...): Promise<Uint8Array>;

  decrypt(...): Promise<Uint8Array>;
}
```

If encryption is not fully implemented, clearly label it as future functionality rather than pretending the system is secure.

---

# 24. LOCAL DATABASE

Use SQLite for structured persistent information.

Suggested tables:

```text
users
contacts
conversations
messages
packet_log
pending_transfers
settings
```

Example:

```sql
users
-----
id
display_name
created_at
public_key
private_key_reference
```

```sql
contacts
--------
user_id
display_name
public_key
created_at
last_seen_at
trusted
blocked
```

```sql
conversations
-------------
id
peer_user_id
created_at
updated_at
```

```sql
messages
--------
id
conversation_id
sender_id
receiver_id
text
timestamp
status
retry_count
```

Use parameterized SQL.

Never construct SQL by string-concatenating user input.

---

# 25. STORAGE LAYER

Create a clean repository layer:

```text
repositories/
    userRepository.ts
    contactRepository.ts
    messageRepository.ts
    conversationRepository.ts
```

Do not put SQL inside React components.

The UI should use hooks/services.

For example:

```ts
useMessages(conversationId)
useContacts()
useNearbyPeers()
useConnectionStatus()
```

---

# 26. APP STRUCTURE

Recommended structure:

```text
src/

  app/
    navigation/
    providers/

  screens/
    Onboarding/
    Home/
    Nearby/
    Chat/
    Contacts/
    ContactDetails/
    MyQR/
    ScanQR/
    JsonLab/
    PacketHistory/
    Settings/
    Diagnostics/

  components/
    Avatar/
    PeerCard/
    MessageBubble/
    ConnectionBadge/
    QRCard/
    JsonEditor/
    EmptyState/
    LoadingState/
    ErrorState/

  ble/
    BleTransport.ts
    BleManager.ts
    BleProtocol.ts
    BleConstants.ts
    BlePermissions.ts
    BleDiscovery.ts
    BleSession.ts

  protocol/
    packets/
    serializers/
    validators/
    chunking/
    deduplication/

  identity/
    identityService.ts
    qrService.ts

  chat/
    chatService.ts
    messageQueue.ts

  storage/
    database.ts
    repositories/

  crypto/
    cryptoService.ts

  state/
    stores/

  hooks/
    useNearbyPeers.ts
    useBleState.ts
    useChat.ts
    useContacts.ts

  theme/
    colors.ts
    spacing.ts
    typography.ts
    radii.ts
    shadows.ts

  utils/
```

Keep responsibilities separate.

---

# 27. NAVIGATION

Use a simple navigation hierarchy.

Suggested:

```text
Home
├── Nearby
├── Contacts
├── Chats
├── QR
└── Settings
```

Potential bottom navigation:

```text
┌────────────────────────────────────┐
│                                    │
│             CONTENT                │
│                                    │
├────────────────────────────────────┤
│  Home    Nearby    Chats    More   │
└────────────────────────────────────┘
```

Do not overcrowd the navigation.

---

# 28. HOME SCREEN

The home screen should immediately tell the user:

1. who they are
2. whether Bluetooth is ready
3. how many peers are nearby
4. their recent conversations
5. what action they can take

Example:

```text
Good evening, Alex

● Ready to connect

2 people nearby

[ Nearby people ]

Recent
────────────────────────

Jordan
See you soon!             2m

Sam
Hello 👋                   8m

[ + ]
```

The user should understand the app within 5 seconds.

---

# 29. EMPTY STATES

Design thoughtful empty states.

No contacts:

```text
Nobody here yet

Scan someone's QR code
or look for people nearby.

[ Find nearby people ]
[ Scan QR ]
```

No messages:

```text
Start a conversation

Connect to someone nearby
to begin chatting.
```

No nearby devices:

```text
Nobody nearby

Make sure Bluetooth is enabled
and keep the other device close.

[ Scan again ]
```

Do not use generic:

```text
No data found.
```

---

# 30. ONBOARDING / PERMISSIONS

Permission handling must feel intentional.

Do not immediately fire five permission prompts.

First explain the reason.

Example:

```text
Connect with nearby people

This app uses Bluetooth to discover
and communicate with nearby devices.

No internet connection is required.

[ Continue ]
```

Then request platform permissions.

On Android, account for modern Bluetooth runtime permissions such as:

* BLUETOOTH_SCAN
* BLUETOOTH_ADVERTISE
* BLUETOOTH_CONNECT

according to the target SDK and actual implementation.

Only request location permission if actually required by the chosen Android implementation and OS version.

On iOS, configure the appropriate Bluetooth usage descriptions and background capabilities only when needed.

---

# 31. BLUETOOTH OFF SCREEN

When Bluetooth is off:

```text
Bluetooth is off

Turn on Bluetooth to find
and communicate with nearby people.

[ Open Bluetooth Settings ]
```

Do not make the entire application unusable.

The user should still be able to:

* view profile
* view QR
* view chat history
* edit settings
* inspect contacts

Only live communication should be unavailable.

---

# 32. BLUETOOTH READY STATE

Show:

```text
● Bluetooth ready
```

not:

```text
Bluetooth state = POWERED_ON
```

Use technical terminology only in Diagnostics.

---

# 33. SETTINGS SCREEN

Include:

```text
Profile
    Name
    My QR

Privacy
    Blocked users
    Stored data

Appearance
    Theme

Communication
    Nearby visibility
    Auto-connect
    Message retry

Diagnostics
    Bluetooth status
    Protocol version
    Connected devices
    Logs

Storage
    Clear chat history
    Clear all app data

About
    App version
    Protocol version
```

Be careful with destructive actions.

Use confirmation sheets.

---

# 34. DEVELOPER / JSON LAB

This is an important power-user feature.

Create a screen called:

```text
Packet Lab
```

It should contain:

```text
Preset
[ CHAT_MESSAGE ▼ ]

JSON
┌──────────────────────────────┐
│ {                            │
│   "type": "CHAT_MESSAGE",    │
│   "text": "Hello"            │
│ }                            │
└──────────────────────────────┘

[ Format ] [ Validate ]

Target
[ Select nearby peer ]

[ Send packet ]
```

Below:

```text
Packet history
```

Each record:

```text
CHAT_MESSAGE
08:42:17
Sent ✓
```

Tap it for full JSON.

---

# 35. PACKET HISTORY

Maintain an optional local diagnostic history.

For each packet:

```text
packet ID
type
sender
receiver
timestamp
direction
status
size
```

Example:

```text
OUTGOING
CHAT_MESSAGE

To: Alex
Size: 182 B
Status: Delivered
08:42:17
```

This should be hidden from ordinary chat UX.

---

# 36. QR UX

The QR should look premium.

Do not put a giant QR code directly against the screen edges.

Use:

```text
┌─────────────────────────┐
│                         │
│       QR CODE           │
│                         │
└─────────────────────────┘

Alex
Your nearby identity

Others can scan this
to identify you.
```

Add a subtle animated scan line only if it looks elegant.

QR scanning screen:

```text
Scan identity

Align the QR code
inside the frame.
```

Do not continually show unnecessary instructions.

Once a valid QR is found:

```text
✓ Identity recognized
```

then show the identity confirmation card.

---

# 37. QR SECURITY / VALIDATION

Do not trust arbitrary QR strings.

Validate:

```text
type
version
userId
displayName
publicKey
required fields
maximum lengths
```

Reject malformed or suspicious payloads.

Do not execute anything contained in the QR.

A QR should represent identity/data, not arbitrary code.

---

# 38. DESIGN SYSTEM

The visual design should be:

* premium
* minimal
* calm
* modern
* highly legible
* whitespace-driven
* polished
* tactile
* restrained

Visual inspiration:

* modern Apple-like information hierarchy
* contemporary system apps
* high-end productivity applications
* minimalist messaging apps

Do not clone Apple or another app.

Create an original visual system.

---

# 39. COLOR SYSTEM

Use a restrained palette.

Suggested:

```ts
background
surface
surfaceElevated
textPrimary
textSecondary
textMuted
border
accent
success
warning
danger
```

Prefer neutral backgrounds.

Use accent colors sparingly.

Do not use excessive gradients.

Do not make every element colorful.

The communication status can use subtle semantic colors.

---

# 40. TYPOGRAPHY

Prioritize:

* clear hierarchy
* large readable headings
* comfortable body text
* compact metadata
* excellent line height

Avoid:

* tiny text
* huge headings occupying half the screen
* decorative fonts

Use platform-friendly typography.

---

# 41. ICONS

Use proper SVG/vector icons.

Do NOT use:

```text
emoji
Unicode symbols
ASCII art
random text characters
```

as primary UI icons.

Use one coherent icon library or a consistent custom SVG icon system.

Icons must have:

* consistent stroke weight
* consistent size
* consistent optical alignment

Examples:

* bluetooth
* qr
* send
* plus
* scan
* settings
* search
* message
* user
* check
* close
* arrow
* info
* retry
* copy

---

# 42. BUTTON DESIGN

Primary buttons should be visually obvious.

Examples:

```text
[ Find nearby ]
```

Secondary:

```text
[ Scan QR ]
```

Tertiary:

```text
Learn more
```

Avoid making five buttons equally prominent.

One primary action per screen whenever possible.

---

# 43. UX PSYCHOLOGY

Every major screen should answer:

### Where am I?

Clear heading.

### What is happening?

Visible state.

### What can I do?

Obvious primary action.

### What happened?

Feedback.

### What happens next?

Clear continuation.

Avoid making users interpret technical information.

Instead of:

```text
Peripheral GATT initialization failed
```

say:

```text
Couldn't connect

The nearby device became unavailable.

[ Try again ]
```

Put the technical reason in Diagnostics.

---

# 44. MICROINTERACTIONS

Use animation carefully.

Examples:

When scanning:

```text
soft pulsing radar
```

When connecting:

```text
subtle progress transition
```

When message sends:

```text
gentle bubble state transition
```

When delivered:

```text
subtle checkmark transition
```

When QR scans:

```text
small success confirmation
```

Do not animate everything.

Animation should communicate state, not decorate the screen.

---

# 45. ACCESSIBILITY

Support:

* dynamic text sizes
* screen readers
* minimum touch targets
* sufficient contrast
* accessible labels
* accessible states

Do not depend on color alone to communicate state.

For example:

```text
● Nearby
```

must also have accessible text:

```text
Nearby and available
```

---

# 46. RESPONSIVENESS

Support a wide range of mobile screen sizes.

Handle:

* small Android phones
* large Android phones
* iPhones with Dynamic Island
* iPhones with notches
* large text
* landscape if appropriate

Respect safe areas.

Do not hardcode screen coordinates.

---

# 47. iOS / ANDROID PLATFORM DIFFERENCES

Do NOT assume the platforms behave identically.

Create platform abstraction where needed.

Explicitly test:

```text
iOS → Android
Android → iOS
iOS → iOS
Android → Android
```

Test:

```text
Bluetooth OFF
Bluetooth ON
permission denied
permission granted
peer unavailable
peer appears
peer disappears
connection succeeds
connection fails
connection drops
app foreground
app background where supported
phone locked where supported
```

Document unsupported platform states honestly.

---

# 48. BACKGROUND BEHAVIOR

Do not promise unlimited background functionality.

iOS and Android enforce platform-specific BLE background rules.

Implement the strongest reliable foreground experience first.

Then implement background behavior only where the operating systems and native APIs actually permit it.

Do not create an architecture that depends on impossible background behavior.

If background support differs:

```text
Android:
supported behavior documented here

iOS:
supported behavior documented here
```

The app should gracefully degrade.

---

# 49. DISCONNECTION HANDLING

When disconnected:

```text
Connection lost

Alex is no longer nearby.

Messages will remain queued
until the connection returns.
```

Do not discard unsent messages.

Provide:

```text
[ Retry ]
```

where appropriate.

---

# 50. AUTO-RECONNECT

For trusted contacts:

```text
disconnected
    ↓
wait
    ↓
scan
    ↓
peer returns
    ↓
reconnect
    ↓
handshake
    ↓
deliver pending messages
```

Use sensible backoff.

Stop trying forever if the user explicitly disables communication or blocks the contact.

---

# 51. MESSAGE DELIVERY MODEL

Implement:

```text
PENDING
   ↓
SENDING
   ↓
SENT
   ↓
DELIVERED
   ↓
READ
```

Failure:

```text
FAILED
```

Retry:

```text
PENDING
```

The state machine must be deterministic.

Never have multiple React components independently modify message status.

Use a central service/store.

---

# 52. STATE MANAGEMENT

Use predictable state separation.

Example:

```text
BLE state
Connection state
Nearby peers
Identity
Contacts
Conversations
Messages
Packet history
Settings
```

Avoid one enormous global state object.

Avoid prop drilling through many levels.

---

# 53. ERROR HANDLING

Every service should return structured errors.

Example:

```ts
type AppError = {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
};
```

Example codes:

```text
BLUETOOTH_DISABLED
BLUETOOTH_PERMISSION_DENIED
BLE_NOT_SUPPORTED
PEER_NOT_FOUND
CONNECTION_TIMEOUT
SERVICE_NOT_FOUND
CHARACTERISTIC_NOT_FOUND
WRITE_FAILED
READ_FAILED
NOTIFY_FAILED
PACKET_INVALID
PACKET_TOO_LARGE
PACKET_TIMEOUT
PEER_REJECTED
SESSION_EXPIRED
```

The UI should translate technical errors into human-friendly messages.

---

# 54. LOGGING

Create structured development logs.

Example:

```text
[BLE]
[DISCOVERY]
[CONNECTION]
[PROTOCOL]
[CHAT]
[STORAGE]
[QR]
```

Do not spam production console logs.

Create a diagnostic logger with levels:

```text
debug
info
warn
error
```

---

# 55. DIAGNOSTICS SCREEN

Create:

```text
Diagnostics
```

Show:

```text
Bluetooth
● Powered On

BLE support
✓ Available

Advertising
● Active

Scanning
● Active

Nearby peers
3

Active sessions
1

Protocol
v1

Database
✓ Healthy
```

Allow:

```text
View logs
Run BLE test
Run JSON loopback test
Clear logs
```

This will be extremely useful during cross-device development.

---

# 56. BLE LOOPBACK TEST

Build an internal diagnostic mode:

```text
Send test packet
```

Example:

```json
{
  "type": "PING",
  "message": "hello"
}
```

The other device replies:

```json
{
  "type": "PONG",
  "message": "hello"
}
```

Show:

```text
✓ Connected
✓ Packet sent
✓ Packet received
✓ Response received
```

This makes BLE debugging much easier than testing through chat alone.

---

# 57. JSON TESTING

Create automated tests for:

* valid packet
* malformed JSON
* missing type
* wrong protocol version
* unknown packet type
* duplicate packet
* oversized packet
* chunking
* reassembly
* serialization
* deserialization

---

# 58. DATABASE TESTING

Test:

* creating identity
* creating contact
* sending message
* storing pending message
* updating status
* deleting conversation
* reopening app
* restoring message history

---

# 59. QR TESTING

Test:

* valid identity QR
* malformed QR
* empty QR
* unknown version
* oversized QR payload
* duplicate contact
* scanning own QR
* scanning same contact repeatedly

---

# 60. BLE TEST MATRIX

Create a test checklist.

### Device combinations

```text
iPhone A → iPhone B
iPhone → Android
Android → iPhone
Android → Android
```

### Transport tests

```text
discover
connect
send
receive
ack
disconnect
reconnect
```

### Failure tests

```text
Bluetooth off
permissions denied
peer leaves range
peer force closes app
connection interrupted
malformed packet
large packet
rapid messages
```

---

# 61. NO FAKE FUNCTIONALITY

This is critical.

Do NOT implement:

```ts
setTimeout(() => setConnected(true), 1000);
```

and pretend BLE is connected.

Do not fake discovered devices in production code.

Do not hardcode "Alex" as a nearby peer.

Do not use random simulated message delivery.

Mocks are allowed only in tests/development mode.

Real builds must use real native BLE communication.

---

# 62. PROGRESSIVE IMPLEMENTATION STRATEGY

Implement in this order:

## Phase 1

Project setup.

* RN
* TypeScript
* navigation
* design system
* theme
* linting
* formatting
* folder architecture

## Phase 2

Local identity.

* onboarding
* name
* user ID
* persistence
* My QR
* QR scanner

## Phase 3

BLE foundation.

First make:

```text
Device A
    ↓
advertise
    ↓
Device B
    ↓
scan
    ↓
discover
```

## Phase 4

BLE connection.

```text
scan
 ↓
connect
 ↓
discover service
 ↓
discover characteristic
```

## Phase 5

Simple transport.

```text
PING
 ↓
PONG
```

## Phase 6

Identity handshake.

```text
HELLO
IDENTITY
CAPABILITIES
READY
```

## Phase 7

JSON transport.

```text
JSON_REQUEST
JSON_RESPONSE
```

## Phase 8

Chat.

## Phase 9

Queue/retry/reconnect.

## Phase 10

Polish and diagnostics.

Do not attempt every feature simultaneously.

A working end-to-end BLE proof is the first major milestone.

---

# 63. FIRST MILESTONE

Before building the full UI, create the smallest possible real test:

```text
Phone A
  ↓
advertise

Phone B
  ↓
scan
  ↓
discover Phone A
  ↓
connect
  ↓
send PING

Phone A
  ↓
receive PING
  ↓
send PONG

Phone B
  ↓
receive PONG
```

This must work on:

```text
iOS ↔ Android
```

using physical devices.

Do not continue building complicated application features on top of a BLE foundation that has not been proven.

---

# 64. SECOND MILESTONE

After the BLE transport works, make this possible:

```text
User A: Alex
User B: Jordan

Alex scans Jordan's QR

Jordan appears in Contacts

Alex sees:

Jordan
● Nearby

[ Open chat ]

Alex sends:

Hello

Jordan receives:

Hello
```

No internet.

No backend.

No manual Bluetooth pairing UI.

---

# 65. THIRD MILESTONE

Make JSON transport:

```text
Alex
 ↓
Packet Lab
 ↓
Select Jordan
 ↓
Send JSON
 ↓
Jordan
 ↓
Packet history
```

Display:

```text
✓ Delivered
```

---

# 66. UI QUALITY BAR

Do not stop when the functionality technically works.

Before considering the project complete, perform a UI refinement pass.

Check:

* spacing
* typography
* hierarchy
* icon consistency
* keyboard behavior
* safe area handling
* animation timing
* touch targets
* dark mode
* empty states
* loading states
* errors
* confirmation dialogs
* scrolling
* long names
* long messages
* large JSON
* large fonts
* narrow screens

Every screen should feel intentionally designed.

---

# 67. DARK MODE

Support dark mode properly.

Do not simply invert colors.

Define separate semantic tokens:

```text
lightBackground
darkBackground

lightSurface
darkSurface

lightTextPrimary
darkTextPrimary
...
```

Make sure QR and scanner screens remain legible.

---

# 68. THE APP SHOULD FEEL FAST

Avoid:

* unnecessary loading screens
* excessive spinners
* blocking database operations
* heavy rerenders
* large synchronous JSON parsing on UI thread

Use asynchronous database work where appropriate.

Keep animations at 60fps where possible.

---

# 69. PERFORMANCE

Optimize:

* peer discovery
* BLE scans
* connection state updates
* message list rendering
* JSON parsing
* packet deduplication
* SQLite access

Use FlatList/FlashList if appropriate.

Do not rerender the entire chat whenever one message changes.

---

# 70. SECURITY / PRIVACY UX

The app should clearly communicate:

```text
No account required.
No internet required.
Your identity is stored on this device.
```

Do not falsely claim:

```text
100% anonymous
military-grade encryption
completely secure
unhackable
```

unless technically justified.

---

# 71. DATA DELETION

Provide:

```text
Delete all local data
```

which removes:

* messages
* contacts
* identity
* packet history
* settings
* local credentials/keys

Warn clearly before performing it.

---

# 72. IDENTITY RESET

Allow identity reset only through Settings.

Explain:

```text
Changing your identity creates a new local identity.

People who know your old identity will
not automatically recognize this device
as the same user.
```

Require explicit confirmation.

---

# 73. CHAT SEARCH

Implement local search if practical.

Search should operate completely offline.

Search:

* message text
* contact names

Do not send search queries anywhere.

---

# 74. CONTACT TRUST

Implement a concept of:

```text
Trusted
Unverified
Blocked
```

QR scanning can help transition:

```text
Discovered
 ↓
Identity recognized
 ↓
Verified by QR
 ↓
Trusted
```

Do not imply that simply seeing a BLE device proves the identity of a human.

---

# 75. PEER DISCOVERY LIST

The Nearby screen should optionally group:

```text
Verified contacts
Other people nearby
```

Example:

```text
Verified
────────────────
Jordan
Sam

Nearby
────────────────
Taylor
Unknown user
```

This makes the QR mechanism meaningful.

---

# 76. AUTOMATIC PEER MATCHING

If a discovered BLE peer's application identity matches a trusted contact:

```text
Bluetooth peer
      ↓
Handshake
      ↓
userId
      ↓
match local contact
      ↓
display saved contact name
```

This prevents confusing:

```text
Jordan
Jordan
Jordan
```

with no idea who is who.

---

# 77. NEARBY IDENTIFICATION FLOW

For unknown peers:

```text
Unknown nearby person

Name: Alex
Identity: •••• A91F

[ Scan QR to verify ]

[ Connect anyway ]
```

After QR:

```text
✓ Identity verified
Alex
```

The user should understand what changed.

---

# 78. CHAT WITH UNVERIFIED USERS

Permit messaging if desired, but display:

```text
Unverified
```

near the profile.

Do not silently claim that the QR was verified when it wasn't.

---

# 79. SESSION PROTOCOL

Implement session initialization:

```text
DEVICE_DISCOVERY
      ↓
CONNECTION
      ↓
SERVICE_DISCOVERY
      ↓
HELLO
      ↓
IDENTITY
      ↓
CAPABILITIES
      ↓
READY
```

After READY:

```text
CHAT
JSON
PING
CONTROL
```

Before READY, application messages should not be accepted.

---

# 80. SESSION TIMEOUT

Each stage should have reasonable timeouts.

Example:

```text
connect timeout
service discovery timeout
handshake timeout
packet acknowledgement timeout
```

Don't allow a session to hang forever.

---

# 81. PROTOCOL VERSIONING

Packets must contain:

```text
version
```

If two devices have incompatible versions:

```text
Incompatible app versions

This device uses protocol v2.
Your device uses protocol v1.
```

Provide graceful fallback where possible.

Do not attempt unsafe interpretation of unknown packet schemas.

---

# 82. FEATURE NEGOTIATION

CAPABILITIES should indicate:

```json
{
  "features": [
    "chat",
    "json",
    "qr-identity",
    "chunking"
  ]
}
```

This lets future versions evolve.

---

# 83. TRANSPORT ABSTRACTION

Even though BLE is the first transport, don't couple the entire app to BLE names.

Prefer:

```ts
interface Transport {
  discoverPeers(): Promise<Peer[]>;
  connect(peerId: string): Promise<void>;
  disconnect(peerId: string): Promise<void>;
  send(data: Uint8Array): Promise<void>;
  onData(callback): Unsubscribe;
}
```

Then:

```text
Transport
   ↑
BLETransport
```

This keeps the architecture extensible.

Do not implement Wi-Fi transport unless required now.

Do not add unnecessary complexity.

---

# 84. NO BACKEND PRINCIPLE

Search the source code after implementation and verify there is no production dependency on:

```text
http://
https://
firebase
supabase
api.example
localhost server
remote authentication
```

apart from legitimate documentation or development references.

The production application should function with network interfaces unavailable.

---

# 85. DEVELOPMENT ENVIRONMENT

Because the app uses native BLE functionality, do not assume Expo Go will be sufficient.

Use a native development build / bare React Native workflow appropriate to the chosen architecture.

Physical devices are mandatory for actual BLE testing.

Do not use emulators as proof of BLE functionality.

---

# 86. DOCUMENTATION

Generate:

```text
README.md
ARCHITECTURE.md
BLE_PROTOCOL.md
PACKET_PROTOCOL.md
DEVELOPMENT.md
TESTING.md
TROUBLESHOOTING.md
```

Document:

* installation
* iOS setup
* Android setup
* permissions
* BLE architecture
* protocol
* local database
* QR identity
* testing
* known platform limitations

---

# 87. TROUBLESHOOTING SCREEN / DOCS

Include explanations for:

```text
Bluetooth unavailable
Permission denied
Peer not discoverable
Peer discovered but cannot connect
Connection drops
Messages remain pending
QR invalid
Protocol mismatch
```

Each should have actionable recovery steps.

---

# 88. TEST COMMANDS

Add package scripts such as:

```text
npm run lint
npm run typecheck
npm test
```

Also document device commands for:

```text
ios
android
```

Use commands appropriate to the actual project setup.

---

# 89. AUTOMATED TESTS

At minimum write tests for:

### Identity

```text
create identity
restore identity
parse QR
validate QR
```

### Protocol

```text
serialize
deserialize
validate
version handling
```

### Packet handling

```text
duplicate detection
chunking
reassembly
ACK handling
```

### Chat

```text
send message
queue message
retry message
receive message
update status
```

### Storage

```text
CRUD
persistence
migration
```

---

# 90. MIGRATIONS

Database schema must have a versioning/migration strategy.

Do not delete and recreate the database on every app update.

---

# 91. DESIGN DETAILS

Use:

* 8pt-ish spacing rhythm
* carefully tuned vertical spacing
* rounded cards only where useful
* subtle separators
* consistent corner radii
* no giant blobs
* no gratuitous glassmorphism
* no neon cyberpunk aesthetic
* no excessive gradients
* no excessive shadows

The app should feel like a mature product.

---

# 92. HOME SCREEN PRIORITY

Primary action hierarchy:

```text
Nearby people
     ↓
Recent chats
     ↓
My identity
     ↓
Settings
```

The user should be able to immediately start communication.

---

# 93. CHAT COMPOSER DETAILS

Support:

* send
* multiline messages
* keyboard-aware layout
* disabled send button when empty
* pending state
* retry failed message
* copy message
* delete local message

Optional:

* reply
* reactions

Do not implement unnecessary social features before core communication works.

---

# 94. JSON EDITOR UX

Use monospaced font for JSON.

Syntax highlighting is optional but preferred.

Show live validity:

```text
✓ Valid JSON
```

or:

```text
Invalid JSON
Line 7, column 14
```

Do not allow Send when the JSON is invalid.

---

# 95. RECEIVED JSON

Display structured metadata:

```text
Received JSON

From
Alex

Type
JSON_RESPONSE

Time
08:41:52

Payload
{
  ...
}
```

Provide:

```text
Copy
Formatted
Raw
```

---

# 96. PACKET SIZE DISPLAY

For diagnostics:

```text
182 B
1.4 KB
```

This helps identify transport issues.

---

# 97. CHAT MESSAGE SIZE

Limit message size to a sensible application maximum.

Do not allow enormous chat messages to accidentally overwhelm BLE.

If a user pastes huge content:

```text
Message too large

Try sending it through Packet Lab
or shorten the message.
```

---

# 98. RAPID MESSAGE HANDLING

Test:

```text
send 10 messages quickly
```

Messages should maintain ordering.

Use sequence numbers or timestamp/order mechanisms where appropriate.

Do not depend only on JavaScript arrival order.

---

# 99. ORDERING

Every message should have:

```text
clientTimestamp
sequenceNumber/session sequence
```

where useful.

Handle delayed packets.

---

# 100. CLOCK DIFFERENCES

Do not assume devices have identical clocks.

Use local timestamps for UI.

Protocol timing should primarily rely on local monotonic/session mechanisms where appropriate.

---

# 101. USER EXPERIENCE RULE

Never make users understand:

```text
GATT
MTU
characteristics
services
central
peripheral
RSSI
UUID
```

unless they open Diagnostics.

Normal user language:

```text
Nearby
Connecting
Connected
Couldn't connect
Try again
Verified
Unverified
Delivered
```

---

# 102. TECHNICAL UI

Technical details belong only in:

```text
Diagnostics
Packet Lab
Developer tools
```

This separation is mandatory.

---

# 103. FINAL QUALITY CHECK

Before declaring the build finished, verify:

## Product

```text
[ ] Onboarding works
[ ] Name persistence works
[ ] Local identity works
[ ] QR generation works
[ ] QR scanning works
[ ] Contact creation works
[ ] BLE discovery works
[ ] BLE connection works
[ ] BLE send works
[ ] BLE receive works
[ ] JSON packet works
[ ] Chat works
[ ] Message queue works
[ ] Retry works
[ ] Reconnect works
[ ] Duplicate detection works
[ ] Local database works
```

## Cross-platform

```text
[ ] iOS → iOS
[ ] Android → Android
[ ] iOS → Android
[ ] Android → iOS
```

## UX

```text
[ ] loading states
[ ] empty states
[ ] permission states
[ ] bluetooth-off state
[ ] errors
[ ] success feedback
[ ] keyboard handling
[ ] safe areas
[ ] dark mode
[ ] accessibility
```

## Engineering

```text
[ ] TypeScript clean
[ ] no obvious runtime errors
[ ] lint passes
[ ] tests pass
[ ] no fake BLE functionality
[ ] no backend dependency
[ ] no cloud requirement
[ ] native permissions configured
[ ] documentation complete
```

---

# 104. IMPORTANT DEVELOPMENT RULE

When you encounter a library compatibility problem:

DO NOT simply replace it with a random older package.

First determine:

1. What capability is actually missing?
2. Whether the platform native API supports it.
3. Whether a maintained package supports it.
4. Whether a small native bridge is the correct solution.

For BLE, native capability is more important than avoiding native code.

---

# 105. IMPLEMENTATION PRIORITY

Priority order:

### P0 — must work

```text
Local identity
QR identity
BLE discovery
BLE connection
BLE packet exchange
iOS ↔ Android
```

### P1

```text
Chat
message queue
ACK
retry
reconnect
contacts
```

### P2

```text
Packet Lab
diagnostics
history
advanced UX
```

### P3

```text
advanced cryptographic identity
background optimization
additional transports
advanced messaging features
```

Do not spend hours polishing animations while the BLE transport is broken.

---

# 106. FINAL AGENT BEHAVIOR

You are not here to merely generate a proposal.

You must:

1. inspect the existing repository
2. determine whether it is a new or existing React Native project
3. preserve useful existing work
4. install necessary dependencies
5. create the architecture
6. implement the screens
7. implement actual BLE transport
8. implement native platform configuration
9. implement local persistence
10. implement QR identity
11. implement packet protocol
12. implement chat
13. implement diagnostics
14. write tests
15. fix TypeScript/lint/build issues
16. run the available checks
17. document anything that cannot be tested in the current environment

Do not repeatedly ask me what to do next if the requirements are already specified here.

Make sensible engineering decisions yourself.

Only stop to ask a question when a decision genuinely cannot be made from this specification.

---

# 107. MOST IMPORTANT ACCEPTANCE TEST

The application is not considered functionally complete until this scenario works on real physical devices:

### DEVICE A

User:

```text
Alex
```

### DEVICE B

User:

```text
Jordan
```

Both have:

```text
Bluetooth ON
Internet OFF
```

Alex opens Nearby.

Jordan opens Nearby.

Alex sees:

```text
Jordan
● Nearby
```

Alex opens Jordan.

Alex sees the correct Jordan identity.

Alex can optionally verify Jordan using Jordan's QR.

Alex taps:

```text
Chat
```

Alex sends:

```text
Hello Jordan 👋
```

Jordan receives the message.

Jordan replies:

```text
Hey Alex!
```

Alex receives the reply.

Then Alex opens Packet Lab and sends:

```json
{
  "type": "JSON_REQUEST",
  "action": "ping",
  "data": {
    "hello": "world"
  }
}
```

Jordan receives it.

Jordan responds with:

```json
{
  "type": "JSON_RESPONSE",
  "success": true,
  "data": {
    "received": true
  }
}
```

Both devices operate entirely without an internet connection.

---

# 108. IMPORTANT HONESTY REQUIREMENT

Do not claim functionality is "fully working" merely because:

* TypeScript compiles
* the UI renders
* a mock BLE service returns success
* a simulator shows fake peers

Real BLE functionality must be tested on physical devices.

If physical device testing cannot be performed in the current environment, clearly mark:

```text
IMPLEMENTED BUT REQUIRES PHYSICAL DEVICE VALIDATION
```

rather than claiming success.

---

# 109. START HERE

Begin by:

### Step 1

Inspect the repository.

### Step 2

Identify:

* current RN version
* package manager
* architecture
* iOS configuration
* Android configuration
* existing dependencies

### Step 3

Research the currently compatible BLE options for the exact RN version.

### Step 4

Choose the BLE architecture based on actual capabilities.

### Step 5

Build the smallest real BLE proof:

```text
ADVERTISEMENT
      ↓
DISCOVERY
      ↓
CONNECTION
      ↓
PING
      ↓
PONG
```

### Step 6

Only after that succeeds, proceed to identity, QR, JSON, chat, storage, polish, and diagnostics.

Do not bury a broken BLE foundation underneath a huge UI implementation.

---

# END GOAL

The finished product should feel like:

> "A beautiful local communication app that just happens to work without the internet."

The user should not need to understand:

* BLE
* GATT
* central/peripheral
* JSON
* UUIDs
* packet protocols

The technology should disappear behind a simple experience:

```text
Open app
   ↓
See nearby people
   ↓
Identify the correct person
   ↓
Connect
   ↓
Communicate
```

Make it feel effortless.

Make it reliable.

Make it technically honest.

Make the architecture maintainable.

Most importantly:

**BUILD REAL FUNCTIONALITY, NOT A DEMO MOCKUP.**
