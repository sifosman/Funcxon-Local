// WEB ONLY — deploy-web/tests/quotes.spec.ts
import { expect, test } from '@playwright/test';
import { gotoPage, signIn, getFirstVenueId, getAuthUser, cleanupTourBookings } from './helpers';

test.describe('Quote Flow Tests', () => {
  test('visit /quotes (signed in) → list renders or empty state shown', async ({ page }) => {
    await signIn(page);
    await gotoPage(page, '/quotes');

    // Should show "My Quotes" heading
    await expect(page.getByText('My Quotes', { exact: true })).toBeVisible({ timeout: 5000 });

    // Either loading skeletons, empty state, or quote list should be visible
    const emptyState = page.getByText('No quotes yet');
    const loadingSkeleton = page.locator('.animate-pulse').first();
    const quoteItem = page.locator('a[href^="/quotes/"]').first();

    await expect(emptyState.or(loadingSkeleton).or(quoteItem)).toBeVisible({ timeout: 10_000 });
  });

  test('submit tour booking → success message', async ({ page }) => {
    const venueId = await getFirstVenueId();
    await signIn(page);
    await gotoPage(page, `/book-tour?venue=${venueId}`);

    // Fill the tour booking form
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(today);
    await page.locator('input[type="time"]').fill('10:00');
    await page.getByPlaceholder('Your name').fill('Test User');
    await page.getByPlaceholder('you@example.com').fill('test@funxon-test.com');
    await page.getByPlaceholder('+27...').fill('+27123456789');

    // Submit
    await page.getByRole('button', { name: 'Request Tour', exact: true }).click();

    // Should show success message
    await expect(page.getByText('Tour Requested!')).toBeVisible({ timeout: 5000 });

    // Cleanup: delete the tour booking created by this test
    try {
      const user = await getAuthUser();
      await cleanupTourBookings(user.id);
    } catch {
      // ignore cleanup errors
    }
  });

  test('protected /quotes → GuestPrompt when not signed in', async ({ page }) => {
    await gotoPage(page, '/quotes');
    await expect(page.getByText(/Sign in to access/)).toBeVisible({ timeout: 5000 });
  });

  test('protected /planner → GuestPrompt when not signed in', async ({ page }) => {
    await gotoPage(page, '/planner');
    await expect(page.getByText(/Sign in to access/)).toBeVisible({ timeout: 5000 });
  });
});
