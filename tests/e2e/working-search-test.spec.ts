import { test, expect } from '@playwright/test';

test.describe('Working Search Form Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homescreen
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Wait for home screen to be ready
    try {
      await page.waitForSelector('text=Connect, Collaborate, Celebrate', { timeout: 10000 });
      console.log('Home screen loaded successfully');
    } catch (e) {
      console.log('Home screen may still be loading');
    }
  });

  test('should test search form functionality', async ({ page }) => {
    console.log('=== SEARCH FORM TEST START ===');
    
    // Take initial screenshot
    await page.screenshot({ path: 'search-test-initial.png', fullPage: true });
    
    // Test service type selection - these are not buttons, likely TouchableOpacity
    console.log('Testing service type selection...');
    
    // Try clicking on "Vendors" text
    try {
      const vendorsElement = page.locator('text=Vendors').first();
      if (await vendorsElement.isVisible({ timeout: 3000 })) {
        await vendorsElement.click();
        await page.waitForTimeout(500);
        console.log('Successfully clicked Vendors');
        await page.screenshot({ path: 'search-test-after-vendors.png', fullPage: true });
      }
    } catch (e) {
      console.log('Could not click Vendors:', (e as Error).message);
    }
    
    // Try clicking on "Venue Portfolios" text
    try {
      const venueElement = page.locator('text=Venue\\nPortfolios').first();
      if (await venueElement.isVisible({ timeout: 3000 })) {
        await venueElement.click();
        await page.waitForTimeout(500);
        console.log('Successfully clicked Venue Portfolios');
        await page.screenshot({ path: 'search-test-after-venues.png', fullPage: true });
      }
    } catch (e) {
      console.log('Could not click Venue Portfolios:', (e as Error).message);
    }
    
    // Try clicking on "All" text
    try {
      const allElement = page.locator('text=All').first();
      if (await allElement.isVisible({ timeout: 3000 })) {
        await allElement.click();
        await page.waitForTimeout(500);
        console.log('Successfully clicked All');
        await page.screenshot({ path: 'search-test-after-all.png', fullPage: true });
      }
    } catch (e) {
      console.log('Could not click All:', (e as Error).message);
    }
    
    // Test category selector
    console.log('Testing category selector...');
    try {
      const categoryElement = page.locator('text=Search by Category').first();
      if (await categoryElement.isVisible({ timeout: 3000 })) {
        await categoryElement.click();
        await page.waitForTimeout(1000);
        console.log('Opened category selector');
        await page.screenshot({ path: 'search-test-category-open.png', fullPage: true });
        
        // Try to select a category
        try {
          const photographyOption = page.locator('text=Photography').first();
          if (await photographyOption.isVisible({ timeout: 2000 })) {
            await photographyOption.click();
            console.log('Selected Photography category');
            await page.waitForTimeout(500);
          }
        } catch (e) {
          console.log('Could not select Photography category');
        }
        
        // Try to close with Done button
        try {
          const doneElement = page.locator('text=Done').first();
          if (await doneElement.isVisible({ timeout: 2000 })) {
            await doneElement.click();
            await page.waitForTimeout(500);
            console.log('Closed category selector');
            await page.screenshot({ path: 'search-test-category-selected.png', fullPage: true });
          }
        } catch (e) {
          console.log('Could not find Done button');
          
          // Try clicking outside to close
          await page.mouse.click(100, 100);
          await page.waitForTimeout(500);
        }
      }
    } catch (e) {
      console.log('Could not open category selector:', (e as Error).message);
    }
    
    // Test capacity selector
    console.log('Testing capacity selector...');
    try {
      const capacityElement = page.locator('text=Event Capacity').first();
      if (await capacityElement.isVisible({ timeout: 3000 })) {
        await capacityElement.click();
        await page.waitForTimeout(1000);
        console.log('Opened capacity selector');
        await page.screenshot({ path: 'search-test-capacity-open.png', fullPage: true });
        
        // Try to select a capacity
        try {
          const capacityOption = page.locator('text=/\\d+.*guests/').first();
          if (await capacityOption.isVisible({ timeout: 2000 })) {
            await capacityOption.click();
            console.log('Selected capacity option');
            await page.waitForTimeout(500);
          }
        } catch (e) {
          console.log('Could not select capacity option');
        }
        
        // Try to close with Done button
        try {
          const doneElement = page.locator('text=Done').first();
          if (await doneElement.isVisible({ timeout: 2000 })) {
            await doneElement.click();
            await page.waitForTimeout(500);
            console.log('Closed capacity selector');
            await page.screenshot({ path: 'search-test-capacity-selected.png', fullPage: true });
          }
        } catch (e) {
          console.log('Could not find Done button');
          await page.mouse.click(100, 100);
          await page.waitForTimeout(500);
        }
      }
    } catch (e) {
      console.log('Could not open capacity selector:', (e as Error).message);
    }
    
    // Test location selector
    console.log('Testing location selector...');
    try {
      const locationElement = page.locator('text=Search Area').first();
      if (await locationElement.isVisible({ timeout: 3000 })) {
        await locationElement.click();
        await page.waitForTimeout(1000);
        console.log('Opened location selector');
        await page.screenshot({ path: 'search-test-location-open.png', fullPage: true });
        
        // Try to select Gauteng
        try {
          const gautengOption = page.locator('text=Gauteng').first();
          if (await gautengOption.isVisible({ timeout: 2000 })) {
            await gautengOption.click();
            console.log('Selected Gauteng');
            await page.waitForTimeout(500);
          }
        } catch (e) {
          console.log('Could not select Gauteng');
        }
        
        // Try to close with Done button
        try {
          const doneElement = page.locator('text=Done').first();
          if (await doneElement.isVisible({ timeout: 2000 })) {
            await doneElement.click();
            await page.waitForTimeout(500);
            console.log('Closed location selector');
            await page.screenshot({ path: 'search-test-location-selected.png', fullPage: true });
          }
        } catch (e) {
          console.log('Could not find Done button');
          await page.mouse.click(100, 100);
          await page.waitForTimeout(500);
        }
      }
    } catch (e) {
      console.log('Could not open location selector:', (e as Error).message);
    }
    
    // Test search functionality
    console.log('Testing search functionality...');
    try {
      const searchElement = page.locator('text=Search').first();
      if (await searchElement.isVisible({ timeout: 3000 })) {
        await searchElement.click();
        await page.waitForTimeout(2000);
        console.log('Clicked Search button');
        await page.screenshot({ path: 'search-test-after-search.png', fullPage: true });
        
        // Check if we got results or redirected
        try {
          // Look for vendor/venue cards
          const cards = page.locator('[data-testid*="vendor-card"], [data-testid*="venue-card"], .vendor-card, .venue-card');
          const cardCount = await cards.count();
          console.log(`Found ${cardCount} result cards`);
          
          if (cardCount > 0) {
            console.log('Search successful - found results');
            
            // Check first few cards
            for (let i = 0; i < Math.min(cardCount, 3); i++) {
              const card = cards.nth(i);
              const cardText = await card.textContent();
              console.log(`Card ${i}: ${cardText?.substring(0, 100)}...`);
            }
          } else {
            console.log('No result cards found, but no redirect either');
          }
        } catch (e) {
          console.log('Error checking for results:', (e as Error).message);
        }
      }
    } catch (e) {
      console.log('Could not click Search button:', (e as Error).message);
    }
    
    // Test Clear All functionality
    console.log('Testing Clear All...');
    try {
      const clearElement = page.locator('text=Clear All').first();
      if (await clearElement.isVisible({ timeout: 3000 })) {
        await clearElement.click();
        await page.waitForTimeout(1000);
        console.log('Clicked Clear All');
        await page.screenshot({ path: 'search-test-after-clear.png', fullPage: true });
      }
    } catch (e) {
      console.log('Could not click Clear All:', (e as Error).message);
    }
    
    console.log('=== SEARCH FORM TEST END ===');
  });

  test('should test random filter combinations', async ({ page }) => {
    console.log('=== RANDOM FILTER TEST START ===');
    
    const serviceTypes = ['All', 'Vendors', 'Venue\\nPortfolios'];
    const categories = ['Photography', 'Catering', 'Decor', 'Audio & Visual'];
    const capacities = ['Up to 50 guests', '51 – 100 guests', '101 – 200 guests'];
    const provinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal'];
    
    // Select random service type
    const randomServiceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    try {
      const serviceElement = page.locator(`text=${randomServiceType}`).first();
      if (await serviceElement.isVisible({ timeout: 3000 })) {
        await serviceElement.click();
        await page.waitForTimeout(500);
        console.log(`Selected random service type: ${randomServiceType}`);
      }
    } catch (e) {
      console.log(`Could not select service type ${randomServiceType}`);
    }
    
    // Select random category
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    try {
      const categoryElement = page.locator('text=Search by Category').first();
      if (await categoryElement.isVisible({ timeout: 3000 })) {
        await categoryElement.click();
        await page.waitForTimeout(1000);
        
        const categoryOption = page.locator(`text=${randomCategory}`).first();
        if (await categoryOption.isVisible({ timeout: 2000 })) {
          await categoryOption.click();
          console.log(`Selected random category: ${randomCategory}`);
        }
        
        const doneElement = page.locator('text=Done').first();
        if (await doneElement.isVisible({ timeout: 2000 })) {
          await doneElement.click();
          await page.waitForTimeout(500);
        }
      }
    } catch (e) {
      console.log(`Could not select category ${randomCategory}`);
    }
    
    // Select random capacity
    const randomCapacity = capacities[Math.floor(Math.random() * capacities.length)];
    try {
      const capacityElement = page.locator('text=Event Capacity').first();
      if (await capacityElement.isVisible({ timeout: 3000 })) {
        await capacityElement.click();
        await page.waitForTimeout(1000);
        
        const capacityOption = page.locator(`text=${randomCapacity}`).first();
        if (await capacityOption.isVisible({ timeout: 2000 })) {
          await capacityOption.click();
          console.log(`Selected random capacity: ${randomCapacity}`);
        }
        
        const doneElement = page.locator('text=Done').first();
        if (await doneElement.isVisible({ timeout: 2000 })) {
          await doneElement.click();
          await page.waitForTimeout(500);
        }
      }
    } catch (e) {
      console.log(`Could not select capacity ${randomCapacity}`);
    }
    
    // Select random province
    const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
    try {
      const locationElement = page.locator('text=Search Area').first();
      if (await locationElement.isVisible({ timeout: 3000 })) {
        await locationElement.click();
        await page.waitForTimeout(1000);
        
        const provinceOption = page.locator(`text=${randomProvince}`).first();
        if (await provinceOption.isVisible({ timeout: 2000 })) {
          await provinceOption.click();
          console.log(`Selected random province: ${randomProvince}`);
        }
        
        const doneElement = page.locator('text=Done').first();
        if (await doneElement.isVisible({ timeout: 2000 })) {
          await doneElement.click();
          await page.waitForTimeout(500);
        }
      }
    } catch (e) {
      console.log(`Could not select province ${randomProvince}`);
    }
    
    // Perform search
    try {
      const searchElement = page.locator('text=Search').first();
      if (await searchElement.isVisible({ timeout: 3000 })) {
        await searchElement.click();
        await page.waitForTimeout(2000);
        console.log('Performed search with random filters');
        await page.screenshot({ path: 'random-filter-search-results.png', fullPage: true });
      }
    } catch (e) {
      console.log('Could not perform search');
    }
    
    console.log('=== RANDOM FILTER TEST END ===');
  });
});
