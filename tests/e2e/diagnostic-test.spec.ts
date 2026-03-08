import { test, expect } from '@playwright/test';

test.describe('Diagnostic Test', () => {
  test('should check current app state', async ({ page }) => {
    console.log('=== DIAGNOSTIC TEST START ===');
    
    // Navigate to app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot to see what's on screen
    await page.screenshot({ path: 'diagnostic-initial.png', fullPage: true });
    console.log('Screenshot saved: diagnostic-initial.png');
    
    // Check page title and URL
    console.log('Current URL:', page.url());
    const title = await page.title();
    console.log('Page title:', title);
    
    // Look for any visible text elements
    const visibleTexts = await page.locator('*:visible').allTextContents();
    console.log('Visible text elements:', visibleTexts.slice(0, 10)); // First 10
    
    // Check for common elements
    const commonSelectors = [
      'text=Connect, Collaborate, Celebrate',
      'text=Get Started',
      'text=Login',
      'text=Sign In',
      'text=Search',
      'text=All',
      'text=Vendors',
      'text=Venue',
      'button',
      'input',
      'form'
    ];
    
    for (const selector of commonSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`Found ${count} elements matching: ${selector}`);
          for (let i = 0; i < Math.min(count, 3); i++) {
            const text = await elements.nth(i).textContent();
            console.log(`  - Element ${i}: "${text}"`);
          }
        }
      } catch (e) {
        console.log(`Error checking ${selector}: ${(e as Error).message}`);
      }
    }
    
    // Try clicking on any visible buttons to see what happens
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    console.log(`Found ${buttonCount} visible buttons`);
    
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        console.log(`Button ${i}: "${buttonText}"`);
        
        if (buttonText && (buttonText.includes('Search') || buttonText.includes('Get Started') || buttonText.includes('Login'))) {
          console.log(`Clicking button: "${buttonText}"`);
          await button.click();
          await page.waitForTimeout(2000);
          
          // Take screenshot after click
          await page.screenshot({ path: `diagnostic-after-${buttonText.replace(/\s+/g, '-')}.png`, fullPage: true });
          console.log(`Screenshot saved: diagnostic-after-${buttonText.replace(/\s+/g, '-')}.png`);
          
          // Check what changed
          const newUrl = page.url();
          console.log('URL after click:', newUrl);
          
          break; // Only click one button for this diagnostic
        }
      }
    }
    
    console.log('=== DIAGNOSTIC TEST END ===');
  });
});
