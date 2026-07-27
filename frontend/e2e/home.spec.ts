import { test, expect } from '@playwright/test';

test.describe('homepage', () => {
  test('loads the Bridgelet payment flows page', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /bridgelet payment flows/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /open sender flow/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /open claim flow/i }),
    ).toBeVisible();
  });

  test('navigates to the sender flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /open sender flow/i }).click();

    await expect(page).toHaveURL(/\/send$/);
    await expect(
      page.getByRole('heading', { name: /send a payment/i }),
    ).toBeVisible();
  });

  test('navigates to the claim flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /open claim flow/i }).click();

    await expect(page).toHaveURL(/\/claim\/example-token/);
    await expect(
      page.getByRole('heading', { name: /claim your payment/i }),
    ).toBeVisible();
  });
});
