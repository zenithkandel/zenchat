# ZenChat — Development Guide

## Prerequisites
- Node.js >= 22.11.0
- React Native 0.87+ (React 19)
- Android Studio with Android SDK API 31+
- Xcode 16+ (for iOS build & physical device testing)

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Running TypeScript Verification
```bash
npm run typecheck
```

### 3. Running Unit Tests
```bash
npm test
```

### 4. Running on Android
```bash
npx react-native run-android
```

### 5. Running on iOS
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

---

## Project Structure Conventions

- **State Management**: Zustand stores located in `src/state/stores/`.
- **Database Access**: Must go through repository classes in `src/storage/repositories/`. Never execute raw SQL in UI components.
- **BLE Calls**: Must go through `bleProtocolEngine` or `bleTransport` abstraction. Never call low-level Bluetooth APIs directly from screens.
- **Theme**: Use `useTheme()` hook for all colors, typography, spacing, and radii tokens.
