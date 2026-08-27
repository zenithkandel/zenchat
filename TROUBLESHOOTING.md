# ZenChat — Troubleshooting Guide

## 1. Bluetooth Issues

### "Bluetooth is off" Banner
- **Cause**: Device Bluetooth adapter is disabled in system settings.
- **Fix**: Open Android Quick Settings or iOS Control Center and toggle Bluetooth on.

### "Nearby people not showing"
- **Cause 1**: Runtime permissions denied.
  - On Android: Ensure `Nearby Devices` (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_ADVERTISE`) permission is granted.
  - On iOS: Ensure Bluetooth is enabled for ZenChat in Settings.
- **Cause 2**: Distance too large or physical interference. BLE range is typically 5-15 meters indoors.
- **Cause 3**: Device is running in an emulator. Emulators cannot advertise or scan real BLE packets.

---

## 2. Message Transmission & Queues

### Messages stuck on "Pending" or "Failed"
- **Cause**: Peer has moved out of range or disconnected.
- **Behavior**: ZenChat automatically queues unsent messages in the offline message queue and retries with exponential backoff (1.5s -> 3s -> 6s -> 12s -> 24s).
- **Fix**: When the peer is detected nearby and reaches `READY` status, the queue flushes automatically. You can also tap "Tap to retry" on any failed message.

---

## 3. QR Identity Verification

### "Invalid QR Data" Error
- **Cause**: Scanned code is a generic URL or non-ZenChat format.
- **Fix**: Ensure the other person is displaying their QR code from the **My QR Code** screen (`More -> My QR Code`).
