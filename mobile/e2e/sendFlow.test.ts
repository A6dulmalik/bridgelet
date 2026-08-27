/**
 * e2e/sendFlow.test.ts
 *
 * Issue #485: Mobile E2E test suite with Detox — Send flow happy path
 *
 * Covers the send flow happy path on both iOS and Android simulators.
 */

import { device, element, by, expect, waitFor } from 'detox';

const VALID_STELLAR_ADDRESS =
  'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';
const SEND_AMOUNT = '10';
const SEND_ASSET = 'USDC';

describe('Send Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // Navigate past onboarding to an existing-wallet session
    await element(by.id('onboarding-existing-wallet')).tap();
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(8000);
  });

  afterEach(async () => {
    // Return to home after each test
    await device.reloadReactNative();
    await element(by.id('onboarding-existing-wallet')).tap();
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(8000);
  });

  it('should navigate to the send screen from the home tab', async () => {
    await element(by.id('tab-send')).tap();
    await expect(element(by.id('send-screen'))).toBeVisible();
  });

  it('should show validation error for empty recipient', async () => {
    await element(by.id('tab-send')).tap();
    await element(by.id('send-amount-input')).typeText(SEND_AMOUNT);
    await element(by.id('send-button')).tap();

    await expect(element(by.id('send-recipient-error'))).toBeVisible();
  });

  it('should show validation error for invalid recipient address', async () => {
    await element(by.id('tab-send')).tap();
    await element(by.id('send-recipient-input')).typeText('not-a-valid-address');
    await element(by.id('send-amount-input')).typeText(SEND_AMOUNT);
    await element(by.id('send-button')).tap();

    await waitFor(element(by.id('send-error-message')))
      .toBeVisible()
      .withTimeout(4000);

    await expect(element(by.id('send-error-message'))).toHaveText(
      'Invalid recipient address.',
    );
  });

  it('should complete the send happy path', async () => {
    await element(by.id('tab-send')).tap();

    // Fill recipient
    await element(by.id('send-recipient-input')).typeText(VALID_STELLAR_ADDRESS);

    // Fill amount
    await element(by.id('send-amount-input')).typeText(SEND_AMOUNT);

    // Select asset
    await element(by.id('send-asset-picker')).tap();
    await element(by.id(`asset-option-${SEND_ASSET}`)).tap();

    // Tap send
    await element(by.id('send-button')).tap();

    // Review screen
    await waitFor(element(by.id('send-review-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('review-amount'))).toBeVisible();
    await expect(element(by.id('review-recipient'))).toBeVisible();
    await expect(element(by.id('review-fee'))).toBeVisible();

    // Confirm
    await element(by.id('confirm-send-button')).tap();

    // Success
    await waitFor(element(by.id('send-success-screen')))
      .toBeVisible()
      .withTimeout(15000);

    await expect(element(by.id('send-success-title'))).toBeVisible();
  });

  it('should allow adding an optional memo', async () => {
    await element(by.id('tab-send')).tap();
    await element(by.id('send-recipient-input')).typeText(VALID_STELLAR_ADDRESS);
    await element(by.id('send-amount-input')).typeText(SEND_AMOUNT);
    await element(by.id('send-memo-input')).typeText('Payment for services');
    await element(by.id('send-button')).tap();

    await waitFor(element(by.id('send-review-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('review-memo'))).toHaveText('Payment for services');
  });

  it('should support scanning a recipient QR code', async () => {
    await element(by.id('tab-send')).tap();
    await element(by.id('scan-recipient-qr')).tap();

    await waitFor(element(by.id('qr-scanner-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Simulator: close scanner
    await element(by.id('close-qr-scanner')).tap();
    await expect(element(by.id('send-screen'))).toBeVisible();
  });
});
