// WEB ONLY — deploy-web/tests/vendor-portal.spec.ts
import { expect, test } from '@playwright/test';
import { gotoPage, signIn } from './helpers';

test.describe('Vendor Portal Tests', () => {
  test('visit /listers-portal (signed in) → page loads, content shown', async ({ page }) => {
    await signIn(page);
    await gotoPage(page, '/listers-portal');

    // Hero heading
    await expect(page.getByText('List Your Business on Funxon')).toBeVisible({ timeout: 5000 });

    // Benefits section
    await expect(page.getByText('Why list with us?')).toBeVisible();

    // Stats section
    await expect(page.getByText('500+')).toBeVisible();
    await expect(page.getByText('10k+')).toBeVisible();

    // CTA
    await expect(page.getByText('Ready to grow your business?')).toBeVisible();
  });

  test('visit /portfolio-type (signed in) → venue/vendor selection buttons present', async ({ page }) => {
    await signIn(page);
    await gotoPage(page, '/portfolio-type');

    await expect(page.getByText('Choose Portfolio Type', { exact: true })).toBeVisible({ timeout: 5000 });

    // Two selection buttons — they contain "Venue" and "Vendor / Service" text
    await expect(page.getByRole('button', { name: /Venue/ })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Vendor/ })).toBeVisible({ timeout: 5000 });
  });

  test('select Vendor → navigates to /apply/step1 or /apply/status', async ({ page }) => {
    await signIn(page);
    await gotoPage(page, '/portfolio-type');

    // Click Vendor / Service button
    await page.getByRole('button', { name: /Vendor/ }).click();

    // Should navigate to step1 (may redirect to /apply/status if blocking app exists)
    await page.waitForURL('**/apply/*', { timeout: 10_000 });
  });

  test('visit /apply/status (signed in) → application status shown', async ({ page }) => {
    await signIn(page);
    await gotoPage(page, '/apply/status');

    // Should show either application status or "Start Application"
    await page.waitForTimeout(3000);

    const statusHeading = page.getByRole('heading', { name: /Application Status|No Application/i });
    const startLink = page.getByRole('link', { name: /Start Application/i });
    await expect(statusHeading.or(startLink).first()).toBeVisible({ timeout: 10_000 });
  });
});
