# Bridgelet Mobile

React Native + Expo mobile app for Bridgelet payment flows.

> **Stack decision:** See [`docs/ADR-001-scaffold.md`](./docs/ADR-001-scaffold.md)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 10 | bundled with Node |
| Expo CLI | latest | `npm install -g expo-cli` |
| iOS Simulator | Xcode 15+ | Mac only — App Store |
| Android Emulator | Android Studio | [developer.android.com](https://developer.android.com/studio) |

---

## Quick Start

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Start Expo dev server
npx expo start

# 3. Open on a device / simulator
#    Press i  — iOS Simulator
#    Press a  — Android Emulator
#    Scan QR  — physical device via Expo Go
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Bridgelet API base URL (e.g. `https://api.bridgelet.org`) |
| `EXPO_PUBLIC_PROJECT_ID` | Expo project ID for push notifications |

---

## Project Structure

```
mobile/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root layout — providers, fonts, deep link setup
│   ├── index.tsx           # Entry / splash redirect
│   ├── (tabs)/             # Tab bar screens
│   ├── claim/              # Claim flow screens
│   ├── send/               # Send flow screens
│   └── security/           # Biometric / PIN setup
├── app/src/                # Feature logic
│   ├── components/         # Shared UI components
│   ├── hooks/              # Custom hooks (wallet, network, biometric, etc.)
│   ├── i18n/               # Localisation (en, es, fr)
│   ├── notifications/      # Push notification setup
│   └── ...
├── e2e/                    # Detox E2E tests
├── docs/                   # Architecture decision records
└── .detoxrc.js             # Detox configuration
```

---

## Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm test -- --coverage

# Detox E2E — iOS Simulator
npx detox build --configuration ios.sim.debug
npx detox test --configuration ios.sim.debug

# Detox E2E — Android Emulator
npx detox build --configuration android.emu.debug
npx detox test --configuration android.emu.debug
```

---

## Building for Distribution

Bridgelet uses **EAS Build** for CI/CD artefacts.

```bash
# Install EAS CLI
npm install -g eas-cli

# iOS debug build
eas build --platform ios --profile development

# Android debug build
eas build --platform android --profile development

# Production build (requires app store credentials)
eas build --platform all --profile production
```

See [`../mobile/APP_STORE_RELEASE.md`](./APP_STORE_RELEASE.md) for release checklist.

---

## Deep Links

Bridgelet handles two URL formats:

| Format | Example |
|--------|---------|
| Universal Link | `https://bridgelet.org/claim/<token>` |
| Custom scheme | `bridgelet://claim/<token>` |

Test deep links on simulator:
```bash
# iOS
xcrun simctl openurl booted "bridgelet://claim/BL-TEST-001"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "bridgelet://claim/BL-TEST-001"
```
