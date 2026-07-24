import { test, expect } from '@playwright/test';

test.describe('sender flow', () => {
  test('renders the send page', async ({ page }) => {
    await page.goto('/send');

    await expect(
      page.getByRole('heading', { name: /send a payment/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/send crypto to anyone/i),
    ).toBeVisible();
  });
});
