import { test, expect } from '@playwright/test';

test.describe('Debug Authentication', () => {
  test('inspect current page state', async ({ page }) => {
    await page.goto('http://localhost:8082');
    await page.waitForTimeout(3000);
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
    
    // Log all visible text
    const pageText = await page.textContent('body');
    console.log('Page text:', pageText?.slice(0, 500));
    
    // Look for any login-related elements
    const loginButtons = await page.locator('text=/log.?in/i').all();
    console.log('Login buttons found:', loginButtons.length);
    
    const accountElements = await page.locator('text=/account/i').all();
    console.log('Account elements found:', accountElements.length);
  });
});
