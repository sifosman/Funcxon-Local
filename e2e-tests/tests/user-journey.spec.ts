import { expect } from 'chai';

describe('Funcxon App - User Journey Tests', () => {
  
  beforeEach(async () => {
    // Wait for app to be ready
    await driver.pause(3000);
  });

  describe('Welcome Screen', () => {
    it('should display welcome screen with Get Started button', async () => {
      const welcomeText = await $('~welcome-title');
      await expect(welcomeText).toBeDisplayed();
      
      const getStartedBtn = await $('~get-started-button');
      await expect(getStartedBtn).toBeDisplayed();
    });

    it('should navigate to home screen after clicking Get Started', async () => {
      const getStartedBtn = await $('~get-started-button');
      await getStartedBtn.click();
      
      // Wait for navigation
      await driver.pause(2000);
      
      // Verify we're on home screen by checking for a known element
      const homeHeader = await $('~home-header');
      await expect(homeHeader).toBeDisplayed();
    });
  });

  describe('Home Screen - Filters', () => {
    it('should open and interact with service type filter', async () => {
      // Click on service type selector
      const serviceTypeBtn = await $('~service-type-selector');
      await serviceTypeBtn.click();
      
      await driver.pause(500);
      
      // Select 'Venues'
      const venuesOption = await $('~venues-option');
      await venuesOption.click();
      
      // Verify selection
      const selectedText = await $('~selected-service-type');
      const text = await selectedText.getText();
      expect(text).toContain('Venues');
    });

    it('should open province selector and select provinces', async () => {
      // Click province selector
      const provinceBtn = await $('~province-selector');
      await provinceBtn.click();
      
      await driver.pause(500);
      
      // Select Gauteng
      const gautengOption = await $('~province-gauteng');
      await gautengOption.click();
      
      // Select Western Cape
      const wcOption = await $('~province-western-cape');
      await wcOption.click();
      
      // Click Done
      const doneBtn = await $('~done-button');
      await doneBtn.click();
      
      // Verify provinces are selected
      const selectedProvinces = await $('~selected-provinces');
      const text = await selectedProvinces.getText();
      expect(text).toContain('Gauteng');
    });

    it('should open city selector after selecting province', async () => {
      // First select a province if not already selected
      const provinceBtn = await $('~province-selector');
      await provinceBtn.click();
      await driver.pause(500);
      
      const gautengOption = await $('~province-gauteng');
      await gautengOption.click();
      
      const doneBtn = await $('~done-button');
      await doneBtn.click();
      await driver.pause(500);
      
      // Now open city selector
      const cityBtn = await $('~city-selector');
      await cityBtn.click();
      await driver.pause(500);
      
      // Select Johannesburg
      const joburgOption = await $('~city-johannesburg');
      await joburgOption.click();
      
      const doneBtn2 = await $('~done-button');
      await doneBtn2.click();
      
      // Verify city is selected
      const selectedCities = await $('~selected-cities');
      const text = await selectedCities.getText();
      expect(text).toContain('Johannesburg');
    });

    it('should use "Use my location" button', async () => {
      const useLocationBtn = await $('~use-my-location');
      await useLocationBtn.click();
      
      // Wait for location detection
      await driver.pause(3000);
      
      // Check if location was detected (or permission dialog appeared)
      try {
        const permissionDialog = await $('//android.widget.Button[@text="Allow"]');
        if (await permissionDialog.isDisplayed()) {
          await permissionDialog.click();
          await driver.pause(2000);
        }
      } catch (e) {
        // Permission dialog didn't appear, that's fine
      }
    });

    it('should click Search button and scroll to results', async () => {
      const searchBtn = await $('~search-button');
      await searchBtn.click();
      
      await driver.pause(2000);
      
      // Verify featured vendors section is visible
      const featuredVendors = await $('~featured-vendors');
      await expect(featuredVendors).toBeDisplayed();
    });

    it('should click Clear All to reset filters', async () => {
      const clearBtn = await $('~clear-all-button');
      await clearBtn.click();
      
      await driver.pause(500);
      
      // Verify filters are cleared
      const selectedProvinces = await $('~selected-provinces');
      const text = await selectedProvinces.getText();
      expect(text).toBe('Select Provinces');
    });
  });

  describe('Home Screen - Vendor Interaction', () => {
    it('should scroll through categories', async () => {
      const categoriesScroll = await $('~categories-scroll');
      
      // Swipe left to scroll through categories
      await driver.touchPerform([
        { action: 'press', options: { x: 300, y: 500 } },
        { action: 'moveTo', options: { x: 100, y: 500 } },
        { action: 'release' }
      ]);
      
      await driver.pause(500);
    });

    it('should click on a category filter', async () => {
      // Find and click a category (e.g., Wedding)
      const weddingCategory = await $('~category-wedding');
      await weddingCategory.click();
      
      await driver.pause(1000);
      
      // Verify filter is applied
      const filterBadge = await $('~filter-badge');
      const text = await filterBadge.getText();
      expect(text).toContain('Wedding');
    });

    it('should click on a vendor to view profile', async () => {
      // Find first vendor
      const firstVendor = await $('~vendor-card-0');
      await firstVendor.click();
      
      await driver.pause(2000);
      
      // Verify we're on vendor profile screen
      const vendorName = await $('~vendor-profile-name');
      await expect(vendorName).toBeDisplayed();
      
      // Go back
      const backBtn = await $('~back-button');
      await backBtn.click();
      
      await driver.pause(1000);
    });

    it('should favorite/unfavorite a vendor', async () => {
      // Find favorite button on first vendor
      const favBtn = await $('~favorite-button-0');
      await favBtn.click();
      
      await driver.pause(500);
      
      // Click again to unfavorite
      await favBtn.click();
      
      await driver.pause(500);
    });
  });

  describe('Quote Request Flow', () => {
    it('should navigate to quote request screen', async () => {
      // Go to a vendor profile first
      const firstVendor = await $('~vendor-card-0');
      await firstVendor.click();
      await driver.pause(2000);
      
      // Click Get Quote button
      const getQuoteBtn = await $('~get-quote-button');
      await getQuoteBtn.click();
      
      await driver.pause(2000);
      
      // Verify we're on quote request screen
      const quoteTitle = await $('~quote-request-title');
      await expect(quoteTitle).toBeDisplayed();
    });

    it('should fill out quote request form', async () => {
      // Fill name
      const nameInput = await $('~quote-name-input');
      await nameInput.setValue('Test User');
      
      // Fill email
      const emailInput = await $('~quote-email-input');
      await emailInput.setValue('test@example.com');
      
      // Fill event details
      const detailsInput = await $('~quote-details-input');
      await detailsInput.setValue('Looking for a venue for 50 guests on March 15, 2024');
      
      await driver.pause(500);
    });

    it('should submit quote request', async () => {
      const submitBtn = await $('~submit-quote-button');
      await submitBtn.click();
      
      await driver.pause(3000);
      
      // Verify success message or navigation
      try {
        const successMessage = await $('~quote-success-message');
        await expect(successMessage).toBeDisplayed();
      } catch (e) {
        // Might navigate back to vendor profile
        const vendorName = await $('~vendor-profile-name');
        await expect(vendorName).toBeDisplayed();
      }
    });
  });

  describe('Navigation Tabs', () => {
    it('should navigate to Quotes tab', async () => {
      const quotesTab = await $('~quotes-tab');
      await quotesTab.click();
      
      await driver.pause(1000);
      
      const quotesTitle = await $('~quotes-title');
      await expect(quotesTitle).toBeDisplayed();
    });

    it('should switch between quote tabs', async () => {
      // Click Pending tab
      const pendingTab = await $('~pending-tab');
      await pendingTab.click();
      await driver.pause(500);
      
      // Click Finalised tab
      const finalisedTab = await $('~finalised-tab');
      await finalisedTab.click();
      await driver.pause(500);
      
      // Click Tours tab
      const toursTab = await $('~tours-tab');
      await toursTab.click();
      await driver.pause(500);
      
      // Back to All
      const allTab = await $('~all-tab');
      await allTab.click();
      await driver.pause(500);
    });

    it('should navigate to Favourites tab', async () => {
      const favouritesTab = await $('~favourites-tab');
      await favouritesTab.click();
      
      await driver.pause(1000);
      
      const favouritesTitle = await $('~favourites-title');
      await expect(favouritesTitle).toBeDisplayed();
    });

    it('should navigate to More/Profile tab', async () => {
      const moreTab = await $('~more-tab');
      await moreTab.click();
      
      await driver.pause(1000);
      
      const profileTitle = await $('~profile-title');
      await expect(profileTitle).toBeDisplayed();
    });
  });
});
