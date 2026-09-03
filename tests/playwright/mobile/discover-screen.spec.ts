import { test, expect } from '@playwright/test';
import { gotoApp, dismissConsentIfPresent } from '../helpers';

test.describe('Mobile Discover Screen', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await dismissConsentIfPresent(page);
  });

  // Item 3: Explore by cards → Discover screen (not filters popup)
  test('explore by cards navigate to discover screen', async ({ page }) => {
    await page.waitForTimeout(3000);
    // This test will be expanded once we identify the exact card selectors
  });

  // Item 4: Province selector = stacked options (3 stacks), coral highlight
  test('province selector shows stacked options', async ({ page }) => {
    // Navigate to discover screen first, then check province selector
    // Placeholder for Phase 2
  });

  // Item 9: Filters = new screen with back button (booking.com style)
  test('filters open as a new screen with back button', async ({ page }) => {
    // Placeholder for Phase 2
  });

  // Item 10: Selecting venues shows only venues, vendors shows only vendors
  test('venue/vendor filter shows correct listing type', async ({ page }) => {
    // Placeholder for Phase 2
  });

  // Item 25: No pricing in listing cards/overviews
  test('no pricing visible in listing cards', async ({ page }) => {
    // Placeholder for Phase 2
  });
});
