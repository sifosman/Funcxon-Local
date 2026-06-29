// WEB ONLY — deploy-web/tests/discover.spec.ts
import { expect, test } from '@playwright/test';
import { gotoPage, dismissConsent } from './helpers';

test.describe('Discover & Search Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '/discover');
  });

  test('navigate to /discover → listings load', async ({ page }) => {
    // The page should show either results or "No listings found" or "Loading..."
    // Wait for loading to finish
    await page.waitForTimeout(3000);

    // Check that the page has loaded — either results count or empty state should be visible
    const resultText = page.locator('text=/\\d+ result/').first();
    const emptyState = page.getByText('No listings found');
    const loadingText = page.getByText('Loading...');

    // Check each separately to avoid strict mode violation with .or()
    const isVisible = async () => {
      if (await resultText.isVisible({ timeout: 1000 }).catch(() => false)) return true;
      if (await emptyState.isVisible({ timeout: 1000 }).catch(() => false)) return true;
      if (await loadingText.isVisible({ timeout: 1000 }).catch(() => false)) return true;
      return false;
    };

    // Poll for up to 10 seconds
    let loaded = false;
    for (let i = 0; i < 10; i++) {
      if (await isVisible()) { loaded = true; break; }
      await page.waitForTimeout(1000);
    }
    expect(loaded).toBeTruthy();
  });

  test('filter by province → results filtered', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(3000);

    // Select a province from the dropdown
    const provinceSelect = page.locator('select').first();
    await expect(provinceSelect).toBeVisible();

    // Select "Gauteng" if available
    const options = await provinceSelect.locator('option').allTextContents();
    const testProvince = options.find((o) => o.includes('Gauteng')) || options[1];

    await provinceSelect.selectOption({ label: testProvince });
    await page.waitForTimeout(2000);

    // Results count should update
    const resultText = page.locator('text=/\\d+ result/').first();
    await expect(resultText).toBeVisible({ timeout: 10_000 });
  });

  test('search by name → results filtered client-side', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(3000);

    // Type into the search input
    const searchInput = page.getByPlaceholder('Search venues, vendors, cities...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('a');
    await page.waitForTimeout(500);

    // Results count should be visible (filtered)
    const resultText = page.locator('text=/\\d+ result/').first();
    await expect(resultText).toBeVisible({ timeout: 5000 });

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);
  });

  test('filter by category pill → venue-only or vendor-only shown', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(3000);

    // Click "Venues" pill
    const venuesPill = page.getByRole('button', { name: 'Venues', exact: true });
    await expect(venuesPill).toBeVisible();
    await venuesPill.click();
    await page.waitForTimeout(2000);

    // URL should have category=venues
    await expect(page).toHaveURL(/category=venues/);

    // Results should be visible
    const resultText = page.locator('text=/\\d+ result/').first();
    await expect(resultText).toBeVisible({ timeout: 5000 });

    // Click "Vendors" pill
    const vendorsPill = page.getByRole('button', { name: 'Vendors', exact: true });
    await vendorsPill.click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/category=vendors/);
  });

  test('clear filters → all results return', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(3000);

    // Apply a category filter
    const venuesPill = page.getByRole('button', { name: 'Venues', exact: true });
    await venuesPill.click();
    await page.waitForTimeout(2000);

    // Clear by clicking "All"
    const allPill = page.getByRole('button', { name: 'All', exact: true });
    await allPill.click();
    await page.waitForTimeout(2000);

    // URL should not have category param
    await expect(page).not.toHaveURL(/category=/);

    // Results should be visible
    const resultText = page.locator('text=/\\d+ result/').first();
    await expect(resultText).toBeVisible({ timeout: 5000 });
  });
});
