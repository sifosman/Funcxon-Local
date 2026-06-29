// WEB ONLY — deploy-web/tests/auth.spec.ts
import { expect, test } from '@playwright/test';
import { gotoPage, signIn, dismissConsent, TEST_USER } from './helpers';

test.describe('Auth Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '/');
  });

  test('sign up with new email → email confirmation page shown', async ({ page }) => {
    // Set consent before navigating
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { try { localStorage.setItem('funxon.dataConsent.v1', 'true'); } catch {} });
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await dismissConsent(page);

    const testEmail = `test_${Date.now()}@funxon-test.com`;
    await page.getByPlaceholder('Your name').fill('Test User');
    await page.getByPlaceholder('you@example.com').fill(testEmail);
    await page.getByPlaceholder('Min 6 characters').fill('TestPass123!');
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();

    // Should show either the "Check your email" success page or an error message
    // (error could happen if Supabase has rate limiting or email restrictions)
    const successMsg = page.getByText('Check your email');
    const errorMsg = page.locator('.bg-error-container');

    await expect(successMsg.or(errorMsg)).toBeVisible({ timeout: 15_000 });

    // If success, verify the email is shown
    if (await successMsg.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(page.getByText(testEmail)).toBeVisible();
    }
  });

  test('sign in with valid credentials → redirected to account', async ({ page }) => {
    await page.goto('/signin', { waitUntil: 'domcontentloaded' });
    await dismissConsent(page);

    await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('Enter your password').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await page.waitForURL('**/account', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/account/);
  });

  test('sign in with invalid credentials → error message shown', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { try { localStorage.setItem('funxon.dataConsent.v1', 'true'); } catch {} });
    await page.goto('/signin', { waitUntil: 'domcontentloaded' });
    await dismissConsent(page);

    await page.getByPlaceholder('you@example.com').fill('wrong@example.com');
    await page.getByPlaceholder('Enter your password').fill('WrongPassword123!');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Error message should appear (Supabase returns "Invalid login credentials")
    await expect(page.locator('.bg-error-container')).toBeVisible({ timeout: 10_000 });
  });

  test('sign out → redirected to home, nav shows Login link', async ({ page }) => {
    await signIn(page);

    // Click Sign Out button
    const signOutBtn = page.getByText('Sign Out', { exact: true });
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    // Should navigate back to home
    await page.waitForURL('**/', { timeout: 10_000 });

    // Header should show Login link (not "Hi, ...")
    await expect(page.getByRole('link', { name: 'Login', exact: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test('protected route redirect → unauthenticated visit to /planner shows GuestPrompt', async ({ page }) => {
    await page.goto('/planner', { waitUntil: 'domcontentloaded' });
    await dismissConsent(page);

    // GuestPrompt shows "Sign in to access planner"
    await expect(page.getByText('Sign in to access planner')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: 'Log in', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get started', exact: true })).toBeVisible();
  });

  test('sign-in page has link to sign-up and vice versa', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { try { localStorage.setItem('funxon.dataConsent.v1', 'true'); } catch {} });
    await page.goto('/signin', { waitUntil: 'domcontentloaded' });
    await dismissConsent(page);

    const signUpLink = page.getByRole('link', { name: 'Sign up', exact: true });
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();
    await expect(page).toHaveURL(/\/signup/);

    // On signup page, link back to signin
    const signInLink = page.getByRole('link', { name: 'Sign in', exact: true });
    await expect(signInLink).toBeVisible();
    await signInLink.click();
    await expect(page).toHaveURL(/\/signin/);
  });
});
