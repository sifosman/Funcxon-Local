import { test, expect } from '@playwright/test';

test.describe('Comprehensive Search Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homescreen
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Check if we need to login (handle auth redirect)
    try {
      await expect(page.getByText('Account', { exact: true })).toBeVisible({ timeout: 5000 });
      console.log('User is already authenticated');
    } catch (error) {
      console.log('User not authenticated, proceeding without auth');
    }
    
    // Additional wait for app to stabilize
    await page.waitForTimeout(2000);
  });

  // Test Data based on actual database
  const provinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal'];
  const venueTypes = ['Ballrooms', 'Gardens', 'Hotels', 'Restaurants', 'Conference Centres'];
  const vendorCategories = [
    'Audio & Visual', 'Catering - Edibles & Drinkables', 'Photography & Videography',
    'Decor & Venue Styling', 'Entertainment - Live Performers & Acts', 'Equipment Hire'
  ];
  const subcategories = [
    'Photographer', 'Videographer', 'Caterers', 'Florists', 'DJ', 'Lighting',
    'Sound System', 'Marquee Hire', 'Chair Hire', 'Table Hire'
  ];
  const amenities = [
    'Parking', 'Wi-Fi', 'Air Conditioning', 'Catering Facilities', 
    'Disabled Access', 'Bar', 'Dance Floor', 'Garden', 'Pool'
  ];
  const capacityRanges = [
    'Up to 50 guests', '51 – 100 guests', '101 – 200 guests', 
    '201 – 500 guests', '501 – 1 000 guests', 'More than 1 000 guests'
  ];

  test.describe('Service Type Selection', () => {
    test('should cycle through all service types', async ({ page }) => {
      const serviceTypes = ['All', 'Vendors', 'Venue\nPortfolios'];
      
      for (const serviceType of serviceTypes) {
        await page.getByText(serviceType).click();
        await page.waitForTimeout(500);
        
        // Verify the selection is applied
        const selectedBtn = page.locator(`button:has-text("${serviceType}")`).first();
        await expect(selectedBtn).toHaveClass(/primary/);
      }
    });

    test('should show/hide relevant fields based on service type', async ({ page }) => {
      // Test Venues - should show venue amenities, hide subcategories
      await page.getByText('Venue\nPortfolios').click();
      await page.waitForTimeout(500);
      
      // Venue amenities should be visible
      await expect(page.getByText('Venue Amenities')).toBeVisible();
      // Subcategories should be hidden
      await expect(page.getByText('What are you looking for?')).not.toBeVisible();
      
      // Test Vendors - should show subcategories, hide venue amenities
      await page.getByText('Vendors').click();
      await page.waitForTimeout(500);
      
      // Subcategories should be visible
      await expect(page.getByText('What are you looking for?')).toBeVisible();
      // Venue amenities should be hidden
      await expect(page.getByText('Venue Amenities')).not.toBeVisible();
      
      // Test All - should show both
      await page.getByText('All').click();
      await page.waitForTimeout(500);
      
      // Both should be visible
      await expect(page.getByText('What are you looking for?')).toBeVisible();
      await expect(page.getByText('Venue Amenities')).toBeVisible();
    });
  });

  test.describe('Category Selection', () => {
    test('should select random vendor categories', async ({ page }) => {
      await page.getByText('Vendors').click();
      await page.waitForTimeout(500);
      
      await page.getByText('Search by Category').click();
      await page.waitForTimeout(500);
      
      // Select 2-3 random categories
      const selectedCategories: string[] = [];
      const numToSelect = Math.floor(Math.random() * 2) + 2; // 2-3 categories
      
      for (let i = 0; i < numToSelect; i++) {
        const randomCategory = vendorCategories[Math.floor(Math.random() * vendorCategories.length)];
        const categoryOption = page.locator(`text=${randomCategory}`).first();
        
        if (await categoryOption.isVisible() && !selectedCategories.includes(randomCategory)) {
          await categoryOption.click();
          selectedCategories.push(randomCategory);
        }
      }
      
      await page.getByText('Done').click();
      await page.waitForTimeout(500);
      
      // Verify categories are selected
      const categoryText = await page.getByText('Search by Category').textContent();
      for (const category of selectedCategories) {
        expect(categoryText).toContain(category);
      }
    });

    test('should select random venue types', async ({ page }) => {
      await page.getByText('Venue\nPortfolios').click();
      await page.waitForTimeout(500);
      
      await page.getByText('Search by Category').click();
      await page.waitForTimeout(500);
      
      // Select 2-3 random venue types
      const selectedVenues: string[] = [];
      const numToSelect = Math.floor(Math.random() * 2) + 2; // 2-3 venues
      
      for (let i = 0; i < numToSelect; i++) {
        const randomVenue = venueTypes[Math.floor(Math.random() * venueTypes.length)];
        const venueOption = page.locator(`text=${randomVenue}`).first();
        
        if (await venueOption.isVisible() && !selectedVenues.includes(randomVenue)) {
          await venueOption.click();
          selectedVenues.push(randomVenue);
        }
      }
      
      await page.getByText('Done').click();
      await page.waitForTimeout(500);
      
      // Verify venue types are selected
      const categoryText = await page.getByText('Search by Category').textContent();
      for (const venue of selectedVenues) {
        expect(categoryText).toContain(venue);
      }
    });
  });

  test.describe('Subcategory Selection', () => {
    test('should select random vendor subcategories', async ({ page }) => {
      await page.getByText('Vendors').click();
      await page.waitForTimeout(500);
      
      // First select a category to enable subcategories
      await page.getByText('Search by Category').click();
      await page.waitForTimeout(500);
      
      const photographyOption = page.locator('text=Photography & Videography').first();
      if (await photographyOption.isVisible()) {
        await photographyOption.click();
        await page.getByText('Done').click();
        await page.waitForTimeout(500);
      }
      
      // Now select subcategories
      await page.getByText('What are you looking for?').click();
      await page.waitForTimeout(500);
      
      // Select 2-3 random subcategories
      const selectedSubcats: string[] = [];
      const numToSelect = Math.floor(Math.random() * 2) + 2; // 2-3 subcategories
      
      for (let i = 0; i < numToSelect; i++) {
        const randomSubcat = subcategories[Math.floor(Math.random() * subcategories.length)];
        const subcatOption = page.locator(`text=${randomSubcat}`).first();
        
        if (await subcatOption.isVisible() && !selectedSubcats.includes(randomSubcat)) {
          await subcatOption.click();
          selectedSubcats.push(randomSubcat);
        }
      }
      
      await page.getByText('Done').click();
      await page.waitForTimeout(500);
      
      // Verify subcategories are selected
      const subcatText = await page.getByText('What are you looking for?').textContent();
      for (const subcat of selectedSubcats) {
        expect(subcatText).toContain(subcat);
      }
    });
  });

  test.describe('Venue Amenities Selection', () => {
    test('should select random venue amenities', async ({ page }) => {
      await page.getByText('Venue\nPortfolios').click();
      await page.waitForTimeout(500);
      
      await page.getByText('Venue Amenities').click();
      await page.waitForTimeout(500);
      
      // Select 2-4 random amenities
      const selectedAmenities: string[] = [];
      const numToSelect = Math.floor(Math.random() * 3) + 2; // 2-4 amenities
      
      for (let i = 0; i < numToSelect; i++) {
        const randomAmenity = amenities[Math.floor(Math.random() * amenities.length)];
        const amenityOption = page.locator(`text=${randomAmenity}`).first();
        
        if (await amenityOption.isVisible() && !selectedAmenities.includes(randomAmenity)) {
          await amenityOption.click();
          selectedAmenities.push(randomAmenity);
        }
      }
      
      await page.getByText('Done').click();
      await page.waitForTimeout(500);
      
      // Verify amenities are selected
      const amenityText = await page.getByText('Venue Amenities').textContent();
      for (const amenity of selectedAmenities) {
        expect(amenityText).toContain(amenity);
      }
    });
  });

  test.describe('Capacity Selection', () => {
    test('should select random capacity ranges', async ({ page }) => {
      await page.getByText('Event Capacity').click();
      await page.waitForTimeout(500);
      
      // Select a random capacity range
      const randomCapacity = capacityRanges[Math.floor(Math.random() * capacityRanges.length)];
      const capacityOption = page.locator(`text=${randomCapacity}`).first();
      
      if (await capacityOption.isVisible()) {
        await capacityOption.click();
        await page.getByText('Done').click();
        await page.waitForTimeout(500);
        
        // Verify capacity is selected
        const capacityText = await page.getByText('Event Capacity').textContent();
        expect(capacityText).toContain(randomCapacity);
      }
    });
  });

  test.describe('Location Selection', () => {
    test('should select random provinces', async ({ page }) => {
      // Click on location area to open province selector
      const locationArea = page.locator('text=Search Area').first();
      if (await locationArea.isVisible()) {
        await locationArea.click();
      } else {
        // Try alternative selector
        await page.locator('[data-testid*="location"]').first().click();
      }
      await page.waitForTimeout(500);
      
      // Select 1-2 random provinces from actual data
      const selectedProvinces: string[] = [];
      const numToSelect = Math.floor(Math.random() * 2) + 1; // 1-2 provinces
      
      for (let i = 0; i < numToSelect; i++) {
        const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
        const provinceOption = page.locator(`text=${randomProvince}`).first();
        
        if (await provinceOption.isVisible() && !selectedProvinces.includes(randomProvince)) {
          await provinceOption.click();
          selectedProvinces.push(randomProvince);
        }
      }
      
      await page.getByText('Done').click();
      await page.waitForTimeout(500);
      
      // Verify provinces are selected
      for (const province of selectedProvinces) {
        await expect(page.getByText(province)).toBeVisible();
      }
    });

    test('should select cities after province selection', async ({ page }) => {
      // First select a province
      const locationArea = page.locator('text=Search Area').first();
      if (await locationArea.isVisible()) {
        await locationArea.click();
      } else {
        await page.locator('[data-testid*="location"]').first().click();
      }
      await page.waitForTimeout(500);
      
      const gautengOption = page.locator('text=Gauteng').first();
      if (await gautengOption.isVisible()) {
        await gautengOption.click();
        await page.getByText('Done').click();
        await page.waitForTimeout(1000);
        
        // Now try to select cities
        const cityArea = page.locator('text=Search Area').first();
        if (await cityArea.isVisible()) {
          await cityArea.click();
          await page.waitForTimeout(500);
          
          // Look for city options
          const joburgOption = page.locator('text=Johannesburg').first();
          if (await joburgOption.isVisible()) {
            await joburgOption.click();
            await page.getByText('Done').click();
            await page.waitForTimeout(500);
            
            // Verify city is selected
            await expect(page.getByText('Johannesburg')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('should perform search with random combination of filters', async ({ page }) => {
      // Random service type
      const serviceTypes = ['All', 'Vendors', 'Venue\nPortfolios'];
      const selectedServiceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      await page.getByText(selectedServiceType).click();
      await page.waitForTimeout(500);
      
      // Apply random filters based on service type
      if (selectedServiceType === 'Vendors' || selectedServiceType === 'All') {
        // Select vendor categories
        await page.getByText('Search by Category').click();
        await page.waitForTimeout(500);
        
        const randomCategory = vendorCategories[Math.floor(Math.random() * vendorCategories.length)];
        const categoryOption = page.locator(`text=${randomCategory}`).first();
        if (await categoryOption.isVisible()) {
          await categoryOption.click();
        }
        await page.getByText('Done').click();
        await page.waitForTimeout(500);
        
        // Select subcategories
        await page.getByText('What are you looking for?').click();
        await page.waitForTimeout(500);
        
        const randomSubcat = subcategories[Math.floor(Math.random() * subcategories.length)];
        const subcatOption = page.locator(`text=${randomSubcat}`).first();
        if (await subcatOption.isVisible()) {
          await subcatOption.click();
        }
        await page.getByText('Done').click();
        await page.waitForTimeout(500);
      }
      
      if (selectedServiceType === 'Venue\nPortfolios' || selectedServiceType === 'All') {
        // Select venue types
        await page.getByText('Search by Category').click();
        await page.waitForTimeout(500);
        
        const randomVenue = venueTypes[Math.floor(Math.random() * venueTypes.length)];
        const venueOption = page.locator(`text=${randomVenue}`).first();
        if (await venueOption.isVisible()) {
          await venueOption.click();
        }
        await page.getByText('Done').click();
        await page.waitForTimeout(500);
        
        // Select amenities
        await page.getByText('Venue Amenities').click();
        await page.waitForTimeout(500);
        
        const randomAmenity = amenities[Math.floor(Math.random() * amenities.length)];
        const amenityOption = page.locator(`text=${randomAmenity}`).first();
        if (await amenityOption.isVisible()) {
          await amenityOption.click();
        }
        await page.getByText('Done').click();
        await page.waitForTimeout(500);
      }
      
      // Select capacity
      await page.getByText('Event Capacity').click();
      await page.waitForTimeout(500);
      
      const randomCapacity = capacityRanges[Math.floor(Math.random() * capacityRanges.length)];
      const capacityOption = page.locator(`text=${randomCapacity}`).first();
      if (await capacityOption.isVisible()) {
        await capacityOption.click();
        await page.getByText('Done').click();
        await page.waitForTimeout(500);
      }
      
      // Select location
      const locationArea = page.locator('text=Search Area').first();
      if (await locationArea.isVisible()) {
        await locationArea.click();
        await page.waitForTimeout(500);
        
        const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
        const provinceOption = page.locator(`text=${randomProvince}`).first();
        if (await provinceOption.isVisible()) {
          await provinceOption.click();
          await page.getByText('Done').click();
          await page.waitForTimeout(500);
        }
      }
      
      // Perform search
      await page.getByText('Search').click();
      await page.waitForTimeout(3000);
      
      // Verify search results are displayed
      const listings = page.locator('[data-testid*="vendor-card"], [data-testid*="venue-card"], .vendor-card, .venue-card');
      const count = await listings.count();
      
      console.log(`Search returned ${count} listings`);
      
      // If results exist, verify they match the filters
      if (count > 0) {
        // Check first few listings for relevant content
        for (let i = 0; i < Math.min(count, 3); i++) {
          const listing = listings.nth(i);
          await expect(listing).toBeVisible();
        }
      }
    });

    test('should validate search results update when filters change', async ({ page }) => {
      // Initial search
      await page.getByText('Search').click();
      await page.waitForTimeout(3000);
      
      const initialListings = page.locator('[data-testid*="vendor-card"], [data-testid*="venue-card"], .vendor-card, .venue-card');
      const initialCount = await initialListings.count();
      console.log(`Initial search returned ${initialCount} listings`);
      
      // Apply a filter
      await page.getByText('Venue\nPortfolios').click();
      await page.waitForTimeout(1000);
      await page.getByText('Search').click();
      await page.waitForTimeout(3000);
      
      // Check that results changed
      const filteredListings = page.locator('[data-testid*="venue-card"], .venue-card');
      const filteredCount = await filteredListings.count();
      console.log(`Filtered search returned ${filteredCount} venue listings`);
      
      // Results should be different (or more specific)
      if (initialCount > 0 && filteredCount > 0) {
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }
    });
  });

  test.describe('Clear All Functionality', () => {
    test('should reset all filters to default state', async ({ page }) => {
      // Apply multiple filters
      await page.getByText('Venue\nPortfolios').click();
      await page.waitForTimeout(500);
      
      await page.getByText('Search by Category').click();
      await page.waitForTimeout(500);
      const ballroomsOption = page.locator('text=Ballrooms').first();
      if (await ballroomsOption.isVisible()) {
        await ballroomsOption.click();
      }
      await page.getByText('Done').click();
      await page.waitForTimeout(500);
      
      await page.getByText('Event Capacity').click();
      await page.waitForTimeout(500);
      const capacityOption = page.locator('text=/\\d+.*guests/').first();
      if (await capacityOption.isVisible()) {
        await capacityOption.click();
        await page.getByText('Done').click();
        await page.waitForTimeout(500);
      }
      
      // Verify filters are applied
      await expect(page.getByText('Ballrooms')).toBeVisible();
      
      // Click Clear All
      await page.getByText('Clear All').click();
      await page.waitForTimeout(1000);
      
      // Verify all filters are reset
      await expect(page.getByText('All')).toBeVisible();
      await expect(page.getByText('Search by Category')).toBeVisible();
      await expect(page.getByText('Event Capacity')).toBeVisible();
    });
  });

  test.describe('Location Detection', () => {
    test('should handle location detection request', async ({ page }) => {
      const locationBtn = page.getByText('Use my location');
      if (await locationBtn.isVisible()) {
        await locationBtn.click();
        
        // Wait for location detection (may show permission dialog)
        await page.waitForTimeout(3000);
        
        // Handle possible permission dialog
        try {
          const allowButton = page.locator('button:has-text("Allow")').first();
          if (await allowButton.isVisible({ timeout: 1000 })) {
            await allowButton.click();
            await page.waitForTimeout(2000);
          }
        } catch (e) {
          // Permission dialog didn't appear
        }
        
        // Check if location was detected and applied
        const detectedLocation = page.locator('text=/Gauteng|Western Cape|KwaZulu-Natal/').first();
        if (await detectedLocation.isVisible({ timeout: 2000 })) {
          console.log('Location successfully detected and applied');
          await expect(detectedLocation).toBeVisible();
        } else {
          console.log('Location detection may have failed or was denied');
        }
      } else {
        console.log('Location detection button not visible');
      }
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle search with no filters applied', async ({ page }) => {
      // Clear any existing filters
      await page.getByText('Clear All').click();
      await page.waitForTimeout(1000);
      
      // Perform search with no filters
      await page.getByText('Search').click();
      await page.waitForTimeout(3000);
      
      // Should show all listings
      const listings = page.locator('[data-testid*="vendor-card"], [data-testid*="venue-card"], .vendor-card, .venue-card');
      const count = await listings.count();
      console.log(`Search with no filters returned ${count} listings`);
      
      // Should show some results (featured listings)
      expect(count).toBeGreaterThan(0);
    });

    test('should handle search with very specific filters', async ({ page }) => {
      // Apply very specific filters
      await page.getByText('Venue\nPortfolios').click();
      await page.waitForTimeout(500);
      
      await page.getByText('Search by Category').click();
      await page.waitForTimeout(500);
      const gardensOption = page.locator('text=Gardens').first();
      if (await gardensOption.isVisible()) {
        await gardensOption.click();
      }
      await page.getByText('Done').click();
      await page.waitForTimeout(500);
      
      await page.getByText('Event Capacity').click();
      await page.waitForTimeout(500);
      const largeCapacityOption = page.locator('text=More than 1 000 guests').first();
      if (await largeCapacityOption.isVisible()) {
        await largeCapacityOption.click();
        await page.getByText('Done').click();
        await page.waitForTimeout(500);
      }
      
      // Perform search
      await page.getByText('Search').click();
      await page.waitForTimeout(3000);
      
      // May return few or no results, which is expected
      const listings = page.locator('[data-testid*="venue-card"], .venue-card');
      const count = await listings.count();
      console.log(`Specific search returned ${count} listings`);
      
      // Either no results or very specific results
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const listing = listings.nth(i);
          await expect(listing).toBeVisible();
        }
      }
    });

    test('should handle rapid filter changes', async ({ page }) => {
      // Rapidly change service types
      await page.getByText('Vendors').click();
      await page.waitForTimeout(200);
      await page.getByText('Venue\nPortfolios').click();
      await page.waitForTimeout(200);
      await page.getByText('All').click();
      await page.waitForTimeout(500);
      
      // Rapidly change categories
      await page.getByText('Search by Category').click();
      await page.waitForTimeout(200);
      const firstOption = page.locator('text=Audio & Visual').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
      await page.waitForTimeout(200);
      const secondOption = page.locator('text=Catering').first();
      if (await secondOption.isVisible()) {
        await secondOption.click();
      }
      await page.getByText('Done').click();
      await page.waitForTimeout(500);
      
      // App should still be responsive
      await expect(page.getByText('Search')).toBeVisible();
    });
  });

  test.describe('Results Validation', () => {
    test('should validate that search results match applied filters', async ({ page }) => {
      // Apply specific filters
      await page.getByText('Venue\nPortfolios').click();
      await page.waitForTimeout(500);
      
      await page.getByText('Search by Category').click();
      await page.waitForTimeout(500);
      const hotelsOption = page.locator('text=Hotels').first();
      if (await hotelsOption.isVisible()) {
        await hotelsOption.click();
      }
      await page.getByText('Done').click();
      await page.waitForTimeout(500);
      
      // Perform search
      await page.getByText('Search').click();
      await page.waitForTimeout(3000);
      
      // Validate results
      const listings = page.locator('[data-testid*="venue-card"], .venue-card');
      const count = await listings.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const listing = listings.nth(i);
          const text = await listing.textContent();
          
          // Should contain hotel-related information
          expect(text?.toLowerCase()).toMatch(/hotel|resort|accommodation/);
        }
      }
    });

    test('should validate that location filters work correctly', async ({ page }) => {
      // Select specific province
      const locationArea = page.locator('text=Search Area').first();
      if (await locationArea.isVisible()) {
        await locationArea.click();
        await page.waitForTimeout(500);
        
        const gautengOption = page.locator('text=Gauteng').first();
        if (await gautengOption.isVisible()) {
          await gautengOption.click();
          await page.getByText('Done').click();
          await page.waitForTimeout(500);
        }
      }
      
      // Perform search
      await page.getByText('Search').click();
      await page.waitForTimeout(3000);
      
      // Validate results show Gauteng location
      const listings = page.locator('[data-testid*="vendor-card"], [data-testid*="venue-card"], .vendor-card, .venue-card');
      const count = await listings.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const listing = listings.nth(i);
          const text = await listing.textContent();
          
          // Should contain Gauteng or cities in Gauteng
          expect(text?.toLowerCase()).toMatch(/gauteng|johannesburg|pretoria|sandton/);
        }
      }
    });
  });
});
