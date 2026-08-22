# Bridgelet Mobile Application

**Status**: 🛠️ **Active / In-Progress (Roadmap Milestone)**

## Overview

The `mobile/` directory contains the cross-platform native application for Bridgelet built using **React Native**, **Expo Router**, and **TypeScript**.

It extends the Bridgelet ecosystem by enabling mobile senders and recipients to generate, send, and claim ephemeral Stellar tokens seamlessly on iOS and Android devices.

## Relationship to Bridgelet Architecture

- **`bridgelet-core`**: The mobile app interacts with Soroban smart contracts on the Stellar network indirectly via `bridgelet-sdk` API endpoints.
- **`bridgelet-sdk`**: Consumes `bridgelet-sdk` REST API endpoints (`/api/v1/ephemeral-accounts`, `/api/v1/claim`) using a secure `apiClient` with token authentication and retry policies.
- **Security & Storage**: Uses `expo-secure-store` and `@react-native-async-storage/async-storage` for secure credential persistence and offline capabilities.

## Getting Started

### Prerequisites
- Node.js 20+
- Expo Go app or iOS Simulator / Android Emulator

### Installation & Execution

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start
```

### Running Tests & Linting

```bash
# Run TypeScript type-check
npm run type-check

# Run unit test suite
npm test

# Run linter
npm run lint
```

## CI Coverage

The mobile application is fully integrated into repository CI via `.github/workflows/mobile-ci.yml`, running `type-check` and unit test suites on every pull request and push to `main`.
