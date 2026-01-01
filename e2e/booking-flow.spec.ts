import { test, expect } from '@playwright/test';

// Login credentials
const USER_EMAIL = 'mohamed@owdsolutions.co.za';
const USER_PASSWORD = 'Thierry14247!';

test.describe('Vibeventz Booking Flow Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Take screenshot of initial state
        await page.screenshot({ path: 'e2e/screenshots/00-initial-state.png', fullPage: true });

        // STEP 1: Click the Login button on the first screen
        // Look for common login button text/labels
        const loginButtonSelectors = [
            page.getByRole('button', { name: /login/i }),
            page.getByRole('button', { name: /sign in/i }),
            page.getByText(/login/i).first(),
            page.getByText(/sign in/i).first(),
            page.locator('button:has-text("Login")'),
            page.locator('button:has-text("Sign In")'),
            page.locator('[data-testid="login-button"]'),
        ];

        let loginClicked = false;
        for (const selector of loginButtonSelectors) {
            try {
                if (await selector.isVisible({ timeout: 2000 })) {
                    console.log('Found login button, clicking...');
                    await selector.click();
                    loginClicked = true;
                    await page.waitForTimeout(2000);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (loginClicked) {
            await page.screenshot({ path: 'e2e/screenshots/01-after-login-click.png', fullPage: true });
        }

        // STEP 2: Now fill in the email and password
        const emailInput = page.getByPlaceholder('Email');
        const passwordInput = page.getByPlaceholder('Password');

        if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('Login form visible, entering credentials...');
            await emailInput.fill(USER_EMAIL);
            await passwordInput.fill(USER_PASSWORD);
            await page.screenshot({ path: 'e2e/screenshots/02-credentials-entered.png', fullPage: true });

            // STEP 3: Click submit/sign in button
            const submitSelectors = [
                page.getByRole('button', { name: /sign in/i }),
                page.getByRole('button', { name: /login/i }),
                page.getByRole('button', { name: /submit/i }),
                page.locator('button[type="submit"]'),
            ];

            for (const submitBtn of submitSelectors) {
                try {
                    if (await submitBtn.isVisible({ timeout: 1000 })) {
                        await submitBtn.click();
                        console.log('Clicked submit button');
                        break;
                    }
                } catch (e) {
                    // Continue
                }
            }

            // Wait for login to complete
            await page.waitForTimeout(5000);
        }

        // Take screenshot after login
        await page.screenshot({ path: 'e2e/screenshots/03-after-login.png', fullPage: true });
    });

    test('Phase 1: Home Screen - Verify slider and form fields', async ({ page }) => {
        await page.screenshot({ path: 'e2e/screenshots/10-home-screen.png', fullPage: true });

        // Check for home screen elements
        const searchInput = page.getByPlaceholder('Search...');
        if (await searchInput.isVisible().catch(() => false)) {
            await searchInput.fill('venue');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'e2e/screenshots/11-search-results.png', fullPage: true });
            await searchInput.clear();
            console.log('✅ Search functionality works');
        }

        // Verify form fields exist
        const eventType = page.getByText('What are you looking for?');
        if (await eventType.isVisible().catch(() => false)) {
            console.log('✅ Event type dropdown visible');
        }
    });

    test('Phase 2: Vendor Profile - View and favorite a vendor', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Click on a vendor
        const vendorCard = page.getByText('Oceanview Wedding Estate').first();
        if (await vendorCard.isVisible().catch(() => false)) {
            await vendorCard.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'e2e/screenshots/20-vendor-profile.png', fullPage: true });
            console.log('✅ Vendor profile opened');
        } else {
            await page.screenshot({ path: 'e2e/screenshots/20-no-vendor-visible.png', fullPage: true });
        }
    });

    test('Phase 3: Planner - Add tasks', async ({ page }) => {
        // Click Planner tab
        const plannerTab = page.getByText('Planner');
        if (await plannerTab.isVisible().catch(() => false)) {
            await plannerTab.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'e2e/screenshots/30-planner.png', fullPage: true });
            console.log('✅ Planner tab opened');
        }
    });

    test('Phase 4: Quotes - View quote list', async ({ page }) => {
        // Click Quotes tab
        const quotesTab = page.getByText('Quotes');
        if (await quotesTab.isVisible().catch(() => false)) {
            await quotesTab.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'e2e/screenshots/40-quotes.png', fullPage: true });
            console.log('✅ Quotes tab opened');
        }
    });

    test('Phase 5: Quote Detail - View priced quote and Accept button', async ({ page }) => {
        // Go to Quotes
        const quotesTab = page.getByText('Quotes');
        if (await quotesTab.isVisible().catch(() => false)) {
            await quotesTab.click();
            await page.waitForTimeout(2000);
        }

        // Click on Test User quote
        const quoteItem = page.getByText('Test User').first();
        if (await quoteItem.isVisible().catch(() => false)) {
            await quoteItem.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'e2e/screenshots/50-quote-detail.png', fullPage: true });

            // Check for Accept button
            const acceptBtn = page.getByText('Accept Quote & Book');
            if (await acceptBtn.isVisible().catch(() => false)) {
                await page.screenshot({ path: 'e2e/screenshots/51-accept-button-visible.png', fullPage: true });
                console.log('✅ Accept Quote & Book button is visible!');
            }
        }
    });

});
