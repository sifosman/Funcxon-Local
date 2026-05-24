import { expect, test } from '@playwright/test';
import { gotoApp, goToWelcomeFromHomeSearch, loginFromWelcome } from './helpers';

test.describe('Search & Discovery (DiscoverScreen) E2E Tests', () => {
  const username = process.env.PW_E2E_USERNAME || 'mohamed@owdsolutions.co.za';
  const password = process.env.PW_E2E_PASSWORD || 'Thierry14247!';

  test.beforeEach(async ({ page }) => {
    // Authenticate and start at a clean state
    await goToWelcomeFromHomeSearch(page);
    await loginFromWelcome(page);
  });

  test('should navigate to Discover screen and search by keywords', async ({ page }) => {
    // 1. Navigate to Discover screen via bottom navigation tab (Search tab is 'Home' with 'Search' label)
    const searchTab = page.getByRole('button', { name: /Search/i }).last();
    await expect(searchTab).toBeVisible();
    await searchTab.click();

    // 2. We should be on the Discover screen. Wait for the title or search input
    const searchInput = page.locator('input[placeholder*="Search by category"], input[placeholder*="Search services"], input[placeholder*="Search by amenity"]').first();
    await expect(searchInput).toBeVisible();

    // 3. Fill search query
    await searchInput.fill('photographer');
    await searchInput.press('Enter');

    // 4. Verify results catalog renders at least one element or displays appropriate status
    // Look for cards, lists, or a "No results found" container
    const vendorCard = page.locator('[data-testid*="vendor-card"], [data-testid*="venue-card"], .vendor-card, .venue-card, text=/results/i').first();
    await expect(vendorCard).toBeVisible({ timeout: 10000 });
  });

  test('should open filters modal and apply multi-criteria search filters', async ({ page }) => {
    // Navigate to Discover screen
    const searchTab = page.getByRole('button', { name: /Search/i }).last();
    await searchTab.click();

    // Wait for discover screen
    await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();

    // 1. Click open filters button (tune icon)
    const filterBtn = page.getByLabel('Open filters').first();
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();

    // 2. Validate filters modal opens
    await expect(page.getByText('Filters', { exact: true })).toBeVisible();

    // 3. Toggle "Browse by" categories (e.g. click 'Vendors')
    const vendorsFilter = page.getByText('Vendors', { exact: true }).first();
    await expect(vendorsFilter).toBeVisible();
    await vendorsFilter.click();

    // 4. Fill text filters in the modal
    const cityInput = page.getByPlaceholder('Filter by city').first();
    await expect(cityInput).toBeVisible();
    await cityInput.fill('Johannesburg');

    const provinceInput = page.getByPlaceholder('Filter by province or state').first();
    await expect(provinceInput).toBeVisible();
    await provinceInput.fill('Gauteng');

    // 5. Select minimum rating filter (e.g., click '4.0+')
    const ratingFilter = page.getByText('4.0+', { exact: true }).first();
    await expect(ratingFilter).toBeVisible();
    await ratingFilter.click();

    // 6. Close the filters modal (click the close icon or background)
    const closeBtn = page.locator('button:has-text("Close"), text=Close, .close, [name="close"]').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      // Tap outside (on the overlay touchable)
      await page.mouse.click(50, 50);
    }

    // 7. Verify the modal is closed
    await expect(page.getByText('Filters', { exact: true })).not.toBeVisible();

    // 8. Verify the list matches our filters or correctly loads the grid
    const resultsPlaceholder = page.locator('[data-testid*="-card"], text=/results|featured/i').first();
    await expect(resultsPlaceholder).toBeVisible({ timeout: 10000 });
  });

  test('should open sort options modal and toggle sorting criteria', async ({ page }) => {
    // Navigate to Discover screen
    const searchTab = page.getByRole('button', { name: /Search/i }).last();
    await searchTab.click();

    // 1. Click open sort options button (swap-vert icon)
    const sortBtn = page.getByLabel('Open sort options').first();
    await expect(sortBtn).toBeVisible();
    await sortBtn.click();

    // 2. Validate sort modal opens (has headers like 'Sort by' or 'Order')
    await expect(page.getByText(/Sort/i).first()).toBeVisible();

    // 3. Choose sort by criteria (e.g., click 'Rating' or 'Price' if visible)
    const ratingSort = page.getByText(/Rating|Name/i).first();
    if (await ratingSort.isVisible().catch(() => false)) {
      await ratingSort.click();
    }

    // 4. Close the sort options modal
    await page.mouse.click(50, 50);
  });
});
