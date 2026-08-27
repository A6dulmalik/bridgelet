# App Store Release Checklist

> **Location:** `mobile/APP_STORE_RELEASE.md`
> **Issue #487:** Mobile app store release checklist and metadata
>
> This document covers all requirements for submitting Bridgelet to the
> Apple App Store and Google Play Store. Update and check off each item
> before every release. Version this file alongside the app source.

---

## Table of Contents

1. [Pre-Release Checklist](#pre-release-checklist)
2. [Apple App Store Requirements](#apple-app-store-requirements)
3. [Google Play Store Requirements](#google-play-store-requirements)
4. [Privacy Labels & Data Collection Disclosure](#privacy-labels--data-collection-disclosure)
5. [Screenshot Specifications](#screenshot-specifications)
6. [App Description](#app-description)
7. [Release Notes Template](#release-notes-template)

---

## Pre-Release Checklist

### Code & Build

- [ ] All unit tests pass (`npm test`)
- [ ] Detox E2E suite passes on both iOS and Android simulators
- [ ] No critical lint warnings (`npm run lint`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Version number bumped in `app.json` (`version` and `ios.buildNumber` / `android.versionCode`)
- [ ] `CHANGELOG.md` updated with release notes
- [ ] Environment variables confirmed for production (`EXPO_PUBLIC_API_URL`, etc.)
- [ ] Sentry / crash reporting DSN points to production project

### Security

- [ ] No hardcoded secrets, keys, or test credentials in source
- [ ] Certificate pinning active for production API calls
- [ ] Biometric / PIN auth tested on physical devices
- [ ] Wallet backup warning reviewed and accurate

### Accessibility

- [ ] VoiceOver (iOS) and TalkBack (Android) tested on main flows
- [ ] Minimum touch target size (44×44 pt) verified on all interactive elements
- [ ] Dynamic Type / large-font tested on claim and send screens

---

## Apple App Store Requirements

### Account & Legal

- [ ] Apple Developer Program membership active
- [ ] App ID registered in App Store Connect
- [ ] Certificates and provisioning profiles up to date
- [ ] Export Compliance information completed (app uses HTTPS/TLS — exempt from BIS encryption)
- [ ] Age Rating questionnaire completed (12+)

### App Metadata

| Field | Value |
|-------|-------|
| **App Name** | Bridgelet |
| **Subtitle** | Stellar payments, simplified |
| **Category (Primary)** | Finance |
| **Category (Secondary)** | Utilities |
| **Age Rating** | 12+ |
| **Copyright** | © 2026 Bridgelet |
| **Support URL** | https://bridgelet.org/support |
| **Marketing URL** | https://bridgelet.org |
| **Privacy Policy URL** | https://bridgelet.org/privacy |

### Build

- [ ] Release build signed with Distribution certificate
- [ ] Bitcode disabled (React Native default)
- [ ] `NSCameraUsageDescription` set (QR scanner)
- [ ] `NSFaceIDUsageDescription` set (biometric auth)
- [ ] `NSPhotoLibraryUsageDescription` set if applicable
- [ ] All required device capabilities declared in `Info.plist`

---

## Google Play Store Requirements

### Account & Legal

- [ ] Google Play Developer account active
- [ ] App signing key stored securely (Google Play App Signing enrolled)
- [ ] Data Safety form completed (see Privacy section below)
- [ ] Target API level ≥ 34 (Android 14) for new submissions

### App Metadata

| Field | Value |
|-------|-------|
| **App Name** | Bridgelet |
| **Short Description** | Send and receive Stellar payments instantly |
| **Category** | Finance |
| **Content Rating** | Everyone |
| **Email** | support@bridgelet.org |
| **Privacy Policy URL** | https://bridgelet.org/privacy |

### Build

- [ ] Release AAB signed with upload key
- [ ] `minSdkVersion` ≥ 24 (Android 7.0)
- [ ] `targetSdkVersion` = 34
- [ ] `CAMERA` permission declared (QR scanner)
- [ ] `USE_BIOMETRIC` and `USE_FINGERPRINT` permissions declared
- [ ] `INTERNET` permission declared
- [ ] ProGuard / R8 rules reviewed to avoid stripping required classes

---

## Privacy Labels & Data Collection Disclosure

Bridgelet is designed with minimal data collection. The following reflects
what the app **actually** collects as of this release.

### Apple App Store — Privacy Nutrition Labels

| Data Type | Collected | Linked to Identity | Used for Tracking |
|-----------|-----------|-------------------|-------------------|
| Financial Info (wallet balance, transaction history) | No — stored on Stellar blockchain, not by Bridgelet | — | No |
| User ID (Stellar public key) | Yes | No — pseudonymous | No |
| Crash Data | Yes (opt-in via Sentry) | No | No |
| Diagnostics / Performance data | Yes (aggregated, anonymised) | No | No |
| Contact Info (email for support) | Optional, only if user contacts support | No | No |

**No data sold to third parties.**
**No data used for advertising or marketing.**

### Google Play — Data Safety Form

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Stellar public key | Yes | No | App functionality |
| Crash logs | Yes (opt-in) | With Sentry (processor) | App stability |
| App interactions | Yes (anonymised) | No | Analytics / improvement |
| Financial transactions | No — all transactions go directly on-chain | — | — |

Users can delete their local data by uninstalling the app.
Wallet keys are stored locally using device-encrypted storage (Expo SecureStore).

---

## Screenshot Specifications

Prepare the following screenshots (light and dark variants recommended):

### iOS

| Device | Dimensions | Required |
|--------|-----------|----------|
| iPhone 6.7" (15 Pro Max) | 1290 × 2796 px | ✅ Required |
| iPhone 6.5" (14 Plus) | 1242 × 2688 px | ✅ Required |
| iPhone 5.5" (8 Plus) | 1242 × 2208 px | ✅ Required |
| iPad Pro 12.9" (6th gen) | 2048 × 2732 px | Required if iPad supported |

### Android

| Type | Dimensions |
|------|-----------|
| Phone | 1080 × 1920 px (min) |
| 7" Tablet | 1200 × 1920 px |
| 10" Tablet | 1920 × 1200 px |

### Required Screens to Capture

- [ ] Onboarding / welcome screen
- [ ] Claim screen with QR scanner prompt
- [ ] Claim success screen showing amount received
- [ ] Send screen with recipient and amount
- [ ] Send review / confirmation screen
- [ ] Home / wallet balance screen
- [ ] Settings screen

---

## App Description

### Short Description (80 chars max — Google Play)

```
Send and receive Stellar payments via shareable claim links.
```

### Full Description

```
Bridgelet makes Stellar payments accessible to everyone — no prior crypto
knowledge required.

SEND PAYMENTS
Create a secure payment link and share it via any messaging app, email, or
QR code. Recipients claim funds directly to their Stellar wallet.

CLAIM PAYMENTS
Receive a Bridgelet link? Tap to claim — we guide you through setting up
a wallet if you don't have one yet.

BUILT ON STELLAR
Every transaction settles in seconds on the Stellar network with near-zero
fees. No intermediaries, no custodians.

SECURE BY DESIGN
• Keys stored in device-encrypted storage
• Optional biometric authentication
• Open-source — audit the code yourself

PRIVATE
Bridgelet does not store your private keys or transaction history.
All payment data lives on the Stellar blockchain.
```

---

## Release Notes Template

```
Version X.Y.Z

What's new:
• [Describe key user-facing changes]
• [Bug fixes and performance improvements]

Full changelog: https://github.com/bridgelet-org/bridgelet/blob/main/CHANGELOG.md
```

---

*Last updated: 2026-08-26 — update this date and version with each release.*
