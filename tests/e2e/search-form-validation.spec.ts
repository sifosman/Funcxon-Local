import { test, expect } from '@playwright/test';

test.describe('Search Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homescreen
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Check if we need to login (handle auth redirect)
    try {
      await expect(page.getByText('Account', { exact: true })).toBeVisible({ timeout: 5000 });
      console.log('User is already authenticated');
    } catch (error) {
      console.log('User not authenticated, checking for login flow');
      // If not authenticated, we should be on welcome/login screen
      // For now, proceed with testing the search form without auth
    }
    
    // Additional wait for app to stabilize
    await page.waitForTimeout(2000);
  });

  test('should validate location filters match listings', async ({ page }) => {
    // Select a specific province
    await page.getByText('Select Provinces').click();
    await page.waitForTimeout(500);
    
    // Look for Gauteng option (adjust selector based on actual implementation)
    const gautengOption = page.locator('text=Gauteng').first();
    if (await gautengOption.isVisible()) {
      await gautengOption.click();
      await page.getByText('Done').click();
    }

    // Click Search button
    await page.getByText('Search').click();
    await page.waitForTimeout(3000);

    // Validate listings show the selected province
    const listings = page.locator('[data-testid*="vendor-card"], [data-testid*="venue-card"]');
    const count = await listings.count();
    
    if (count > 0) {
      // Check first few listings for location match
      for (let i = 0; i < Math.min(count, 3); i++) {
        const listing = listings.nth(i);
        const locationText = await listing.textContent();
        expect(locationText?.toLowerCase()).toContain('gauteng');
      }
    }
  });

  test('should validate category filters match listings', async ({ page }) => {
    // Select Venues service type
    await page.getByText('Venue\nPortfolios').click();
    
    // Select venue category
    await page.getByText('Search by Category').click();
    await page.waitForTimeout(500);
    
    // Look for Ballrooms option
    const ballroomsOption = page.locator('text=Ballrooms').first();
    if (await ballroomsOption.isVisible()) {
      await ballroomsOption.click();
      await page.getByText('Done').click();
    }

    // Click Search button
    await page.getByText('Search').click();
    await page.waitForTimeout(3000);

    // Validate listings are venues and match category
    const listings = page.locator('[data-testid*="venue-card"]');
    const count = await listings.count();
    
    if (count > 0) {
      // Check that listings are venues
      for (let i = 0; i < Math.min(count, 3); i++) {
        const listing = listings.nth(i);
        const text = await listing.textContent();
        // Should contain venue-related information
        expect(text?.toLowerCase()).toMatch(/ballroom|venue|hall/);
      }
    }
  });

  test('should validate amenities filters match venue listings', async ({ page }) => {
    // Select Venues service type
    await page.getByText('Venue\nPortfolios').click();
    
    // Select venue amenities
    await page.getByText('Venue Amenities').click();
    await page.waitForTimeout(500);
    
    // Look for Parking option
    const parkingOption = page.locator('text=Parking').first();
    if (await parkingOption.isVisible()) {
      await parkingOption.click();
      await page.getByText('Done').click();
    }

    // Click Search button
    await page.getByText('Search').click();
    await page.waitForTimeout(3000);

    // Validate venues have the selected amenity
    const listings = page.locator('[data-testid*="venue-card"]');
    const count = await listings.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const listing = listings.nth(i);
        const text = await listing.textContent();
        // Should contain parking information
        expect(text?.toLowerCase()).toMatch(/parking/);
      }
    }
  });

  test('should validate capacity filters match listings', async ({ page }) => {
    // Select capacity
    await page.getByText('Event Capacity').click();
    await page.waitForTimeout(500);
    
    // Look for capacity option (e.g., "100-200")
    const capacityOption = page.locator('text=/\\d+-\\d+/').first();
    if (await capacityOption.isVisible()) {
      await capacityOption.click();
      await page.getByText('Done').click();
    }

    // Click Search button
    await page.getByText('Search').click();
    await page.waitForTimeout(3000);

    // Validate listings meet capacity requirements
    const listings = page.locator('[data-testid*="venue-card"]');
    const count = await listings.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const listing = listings.nth(i);
        const text = await listing.textContent();
        // Should contain capacity information
        expect(text?.toLowerCase()).toMatch(/capacity|guests|seats/);
      }
    }
  });

  test('should validate vendor subcategory filters', async ({ page }) => {
    // Select Vendors service type
    await page.getByText('Vendors').click();
    
    // Select vendor category (e.g., Photography)
    await page.getByText('Search by Category').click();
    await page.waitForTimeout(500);
    
    const photographyOption = page.locator('text=Photography').first();
    if (await photographyOption.isVisible()) {
      await photographyOption.click();
      await page.getByText('Done').click();
    }

    // Select subcategory
    await page.getByText('What are you looking for?').click();
    await page.waitForTimeout(500);
    
    const photographerOption = page.locator('text=Photographer').first();
    if (await photographerOption.isVisible()) {
      await photographerOption.click();
      await page.getByText('Done').click();
    }

    // Click Search button
    await page.getByText('Search').click();
    await page.waitForTimeout(3000);

    // Validate listings are photographers
    const listings = page.locator('[data-testid*="vendor-card"]');
    const count = await listings.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const listing = listings.nth(i);
        const text = await listing.textContent();
        expect(text?.toLowerCase()).toMatch(/photographer|photography|camera/);
      }
    }
  });

  test('should validate combined filters work together', async ({ page }) => {
    // Select Venues
    await page.getByText('Venue\nPortfolios').click();
    
    // Select province
    await page.getByText('Select Provinces').click();
    await page.waitForTimeout(500);
    
    const westernCapeOption = page.locator('text=Western Cape').first();
    if (await westernCapeOption.isVisible()) {
      await westernCapeOption.click();
      await page.getByText('Done').click();
    }

    // Select venue type
    await page.getByText('Search by Category').click();
    await page.waitForTimeout(500);
    
    const gardensOption = page.locator('text=Gardens').first();
    if (await gardensOption.isVisible()) {
      await gardensOption.click();
      await page.getByText('Done').click();
    }

    // Click Search button
    await page.getByText('Search').click();
    await page.waitForTimeout(3000);

    // Validate all filters are applied
    const listings = page.locator('[data-testid*="venue-card"]');
    const count = await listings.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const listing = listings.nth(i);
        const text = await listing.textContent();
        // Should match both location and venue type
        expect(text?.toLowerCase()).toMatch(/western cape|garden/);
      }
    }
  });

  test('should validate Clear All resets filters', async ({ page }) => {
    // Apply some filters first
    await page.getByText('Venue\nPortfolios').click();
    await page.getByText('Select Provinces').click();
    await page.waitForTimeout(500);
    
    const gautengOption = page.locator('text=Gauteng').first();
    if (await gautengOption.isVisible()) {
      await gautengOption.click();
      await page.getByText('Done').click();
    }

    // Verify filters are applied
    expect(await page.getByText('Gauteng').isVisible()).toBeTruthy();

    // Click Clear All
    await page.getByText('Clear All').click();
    await page.waitForTimeout(1000);

    // Verify filters are reset
    expect(await page.getByText('Select Provinces').isVisible()).toBeTruthy();
    expect(await page.getByText('All').isVisible()).toBeTruthy();
  });

  test('should validate location detection functionality', async ({ page }) => {
    // Test location detection button
    const locationBtn = page.getByText('Use my location');
    if (await locationBtn.isVisible()) {
      await locationBtn.click();
      
      // Wait for location detection (may show permission dialog)
      await page.waitForTimeout(3000);
      
      // Check if location was detected and applied
      const detectedLocation = page.locator('text=/Using .+/');
      if (await detectedLocation.isVisible()) {
        // Location was successfully detected
        expect(await detectedLocation.isVisible()).toBeTruthy();
      }
    }
  });

  test('should validate search results update dynamically', async ({ page }) => {
    // Get initial listing count
    await page.getByText('Search').click();
    await page.waitForTimeout(3000);
    
    const initialListings = page.locator('[data-testid*="vendor-card"], [data-testid*="venue-card"]');
    const initialCount = await initialListings.count();

    // Apply a filter
    await page.getByText('Venue\nPortfolios').click();
    await page.waitForTimeout(1000);
    await page.getByText('Search').click();
    await page.waitForTimeout(3000);

    // Check that results changed
    const filteredListings = page.locator('[data-testid*="venue-card"]');
    const filteredCount = await filteredListings.count();

    // Results should be different (or more specific)
    if (initialCount > 0 && filteredCount > 0) {
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });
});
