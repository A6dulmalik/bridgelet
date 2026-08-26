/**
 * e2e/claimFlow.test.ts
 *
 * Issue #485: Mobile E2E test suite with Detox
 *
 * Covers the claim flow for:
 *  - New wallet path (no existing wallet)
 *  - Existing wallet path
 * Targets both iOS and Android simulators.
 */

import { device, element, by, expect, waitFor } from 'detox';

const VALID_CLAIM_CODE = 'BL-TEST-CLAIM-001';
const INVALID_CLAIM_CODE = 'BL-INVALID-CODE';
const ALREADY_CLAIMED_CODE = 'BL-ALREADY-CLAIMED';

describe('Claim Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterEach(async () => {
    await device.reloadReactNative();
  });

  // ── New wallet path ──────────────────────────────────────────────────────────

  describe('New wallet path', () => {
    it('should display the claim screen from onboarding', async () => {
      // Arrive at onboarding
      await expect(element(by.id('onboarding-title'))).toBeVisible();

      // Tap "Get Started" which routes to claim
      await element(by.id('onboarding-get-started')).tap();

      // Claim screen should be visible
      await expect(element(by.id('claim-screen'))).toBeVisible();
    });

    it('should show an error for an invalid claim code', async () => {
      await element(by.id('onboarding-get-started')).tap();
      await element(by.id('claim-code-input')).typeText(INVALID_CLAIM_CODE);
      await element(by.id('claim-button')).tap();

      await waitFor(element(by.id('claim-error-message')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('claim-error-message'))).toHaveText(
        'Invalid or expired claim code.',
      );
    });

    it('should create a wallet and claim funds with a valid code', async () => {
      await element(by.id('onboarding-get-started')).tap();
      await element(by.id('claim-code-input')).typeText(VALID_CLAIM_CODE);
      await element(by.id('claim-button')).tap();

      // Wallet creation prompt should appear for new users
      await waitFor(element(by.id('new-wallet-prompt')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('create-wallet-confirm')).tap();

      // Success screen
      await waitFor(element(by.id('claim-success-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.id('claim-success-title'))).toBeVisible();
    });

    it('should show an error for an already-claimed code', async () => {
      await element(by.id('onboarding-get-started')).tap();
      await element(by.id('claim-code-input')).typeText(ALREADY_CLAIMED_CODE);
      await element(by.id('claim-button')).tap();

      await waitFor(element(by.id('claim-error-message')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('claim-error-message'))).toHaveText(
        'This payment has already been claimed.',
      );
    });
  });

  // ── Existing wallet path ─────────────────────────────────────────────────────

  describe('Existing wallet path', () => {
    beforeEach(async () => {
      // Navigate via the "I already have a wallet" path
      await element(by.id('onboarding-existing-wallet')).tap();
      // Assume wallet setup / import flow completes
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(8000);
    });

    it('should reach the claim screen from the home tab', async () => {
      await element(by.id('tab-claim')).tap();
      await expect(element(by.id('claim-screen'))).toBeVisible();
    });

    it('should successfully claim funds to existing wallet', async () => {
      await element(by.id('tab-claim')).tap();
      await element(by.id('claim-code-input')).typeText(VALID_CLAIM_CODE);
      await element(by.id('claim-button')).tap();

      // Should NOT show new wallet prompt for existing wallet users
      await expect(element(by.id('new-wallet-prompt'))).not.toBeVisible();

      await waitFor(element(by.id('claim-success-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.id('claim-success-title'))).toBeVisible();
    });

    it('should support scanning a QR code for the claim code', async () => {
      await element(by.id('tab-claim')).tap();
      await element(by.id('scan-qr-button')).tap();

      await waitFor(element(by.id('qr-scanner-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Simulator: close scanner (camera not available in CI)
      await element(by.id('close-qr-scanner')).tap();
      await expect(element(by.id('claim-screen'))).toBeVisible();
    });
  });
});
