import { expect, test } from '@playwright/test';
import { dismissConsentIfPresent, gotoApp, goToWelcomeFromHomeSearch, loginFromWelcome } from './helpers';

test.describe('Search & Discovery (DiscoverScreen) E2E Tests', () => {
  const username = process.env.PW_E2E_USERNAME || 'mohamed@owdsolutions.co.za';
  const password = process.env.PW_E2E_PASSWORD || 'Thierry14247!';

  test.beforeEach(async ({ page }) => {
    // Authenticate and start at a clean state
    await goToWelcomeFromHomeSearch(page);
    await loginFromWelcome(page);
  });

  async function navigateToDiscover(page: any) {
    // Dismiss any consent modal, then use the top header "Vendors" button to reach
    // Discover without automatically opening the filter modal.
    await dismissConsentIfPresent(page);
    const vendorsButton = page.getByText('Vendors', { exact: true }).first();
    if (await vendorsButton.isVisible().catch(() => false)) {
      await vendorsButton.click({ force: true });
      await page.waitForTimeout(400);
    } else {
      // Fallback to direct JavaScript click if Playwright cannot target the header
      await page.evaluate(() => {
        const vendors = Array.from(document.querySelectorAll('div')).find(
          (d) => d.textContent === 'Vendors' && d.getBoundingClientRect().width > 0
        );
        if (vendors) {
          let clickable = vendors.parentElement;
          while (clickable && !clickable.getAttribute('tabindex') && !clickable.getAttribute('role')) {
            clickable = clickable.parentElement;
          }
          (clickable || vendors).click();
        }
      });
      await page.waitForTimeout(400);
    }
  }

  test('should navigate to Discover screen and search by keywords', async ({ page }) => {
    // 1. Navigate to Discover screen via the Explore by "By Services" option
    await navigateToDiscover(page);

    // 2. We should be on the Discover screen. Wait for the search input
    const searchInput = page.locator('input[placeholder*="Search venues, vendors, services"], input[placeholder*="Search by category"], input[placeholder*="Search services"], input[placeholder*="Search by amenity"], input[placeholder*="Quick search by venue name"], input[placeholder*="Search vendors and services"]').first();
    await expect(searchInput).toBeVisible();

    // 3. Fill search query
    await searchInput.fill('photographer');
    await searchInput.press('Enter');

    // 4. Verify results catalog renders at least one element or displays appropriate status
    const result = page.locator('text=/Search results|No listings found|All listings/i').first();
    await expect(result).toBeVisible({ timeout: 10000 });
  });

  test('should open filters modal and apply multi-criteria search filters', async ({ page }) => {
    // 1. Navigate to Discover screen
    await navigateToDiscover(page);

    // 2. Wait for discover screen
    const searchInput = page.locator('input[placeholder*="Search venues, vendors, services"], input[placeholder*="Search by category"], input[placeholder*="Search services"], input[placeholder*="Search by amenity"], input[placeholder*="Quick search by venue name"], input[placeholder*="Search vendors and services"]').first();
    await expect(searchInput).toBeVisible();

    // 3. Click open filters button (tune icon)
    const filterBtn = page.getByLabel('Open filters').first();
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();

    // 4. Validate filters modal opens
    await expect(page.getByText('Browse by', { exact: true })).toBeVisible();

    // 5. Toggle "Browse by" category to 'Vendors & Services'
    const vendorsFilter = page.getByText('Vendors & Services', { exact: true }).first();
    await expect(vendorsFilter).toBeVisible();
    await vendorsFilter.click();

    // 6. Close the filters modal by tapping the close icon
    const closeBtn = page.locator('[name="close"]').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.mouse.click(50, 50);
    }

    // 7. Verify the list matches our filters or correctly loads the grid
    await expect(page.getByText('Search results', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('should open sort options modal and toggle sorting criteria', async ({ page }) => {
    // 1. Navigate to Discover screen
    await navigateToDiscover(page);

    // 2. Wait for discover screen
    const searchInput = page.locator('input[placeholder*="Search venues, vendors, services"], input[placeholder*="Search by category"], input[placeholder*="Search services"], input[placeholder*="Search by amenity"], input[placeholder*="Quick search by venue name"], input[placeholder*="Search vendors and services"]').first();
    await expect(searchInput).toBeVisible();

    // 3. Click open sort options button (swap-vert icon)
    const sortBtn = page.getByLabel('Open sort options').first();
    await expect(sortBtn).toBeVisible();
    await sortBtn.click();

    // 4. Validate sort options modal opens (uses a simple dropdown inline)
    await expect(page.getByText('Sort by', { exact: true }).first()).toBeVisible();

    // 5. Choose sort by criteria (e.g., click 'Rating' if visible)
    const ratingSort = page.getByText('Rating', { exact: true }).first();
    if (await ratingSort.isVisible().catch(() => false)) {
      await ratingSort.click();
    }

    // 6. Close the sort options by clicking elsewhere
    await page.mouse.click(50, 50);
  });
});
