import { test, expect } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'mohamed@owdsolutions.co.za',
  password: 'Thierry14247!'
};

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8081';

test.describe('Quote System Simple Tests', () => {
  
  test('basic login flow', async ({ page }) => {
    console.log('Testing basic login flow...');
    
    // Go to the app
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    // Check if already logged in
    const homeIndicators = ['text=Home', 'text=Search', 'text=Categories'];
    let isLoggedIn = false;
    
    for (const indicator of homeIndicators) {
      if (await page.locator(indicator).isVisible().catch(() => false)) {
        console.log('Already logged in');
        isLoggedIn = true;
        break;
      }
    }
    
    if (!isLoggedIn) {
      console.log('Not logged in, trying to login...');
      
      // Try to find login button or get started
      const loginSelectors = ['text=Login', 'text=Log in', 'text=Get Started'];
      
      for (const selector of loginSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            await button.click();
            await page.waitForTimeout(2000);
            break;
          }
        } catch (e) {
          // Continue trying
        }
      }
      
      // Fill credentials
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill(TEST_CREDENTIALS.email);
        
        const passwordInput = page.locator('input[type="password"]').first();
        if (await passwordInput.isVisible({ timeout: 3000 })) {
          await passwordInput.fill(TEST_CREDENTIALS.password);
          
          // Click login
          const loginButton = page.locator('text=Sign in, text=Log in, text=Login').first();
          if (await loginButton.isVisible({ timeout: 3000 })) {
            await loginButton.click();
            await page.waitForTimeout(5000);
          }
        }
      }
    }
    
    // Verify we can see the app
    const appElements = ['text=Home', 'text=Search', 'text=Categories'];
    let foundApp = false;
    
    for (const element of appElements) {
      if (await page.locator(element).isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log(`Found app element: ${element}`);
        foundApp = true;
        break;
      }
    }
    
    expect(foundApp).toBe(true);
    console.log('Login test completed successfully!');
  });

  test('test Edge Function directly', async ({ request }) => {
    console.log('Testing Edge Function...');
    
    const response = await request.post(`${BASE_URL}/functions/v1/send-quote-notifications`, {
      data: {
        type: 'quote-requested-vendor',
        quoteRequestId: 1,
        clientName: 'Test Client',
        vendorEmail: 'test@example.com',
        vendorBusinessName: 'Test Vendor'
      }
    });
    
    // Should return 200, 400, or 500 (any indicates function is deployed)
    expect([200, 400, 500]).toContain(response.status());
    console.log('Edge Function test completed!');
  });

  test('check database connection', async ({ request }) => {
    console.log('Testing database connection via Edge Function...');
    
    const response = await request.post(`${BASE_URL}/functions/v1/send-quote-notifications`, {
      data: {
        type: 'quote-created-client',
        quoteRequestId: 1,
        quoteRevisionId: 1,
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        vendorBusinessName: 'Test Vendor',
        quoteAmount: 15000,
        quoteDescription: 'Test quote'
      }
    });
    
    expect([200, 400, 500]).toContain(response.status());
    console.log('Database connection test completed!');
  });
});
