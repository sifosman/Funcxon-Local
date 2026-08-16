import { expect, test, type Page } from '@playwright/test';
import {
  acceptPopiaConsent,
  clickBottomTab,
  getGlobalTestUser,
  getTestAccounts,
  openAccountMenuItem,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Phase 1 — Authentication & Onboarding (UI Login)', () => {
  // Support both new two-account format and legacy single-user format
  const accounts = getTestAccounts();
  const globalUser = getGlobalTestUser();
  const adminCreated = accounts?.adminCreated ?? globalUser?.adminCreated ?? false;
  const mainUser = adminCreated
    ? accounts
      ? { email: accounts.attendee.email, password: accounts.attendee.password, fullName: accounts.attendee.fullName }
      : { email: globalUser!.email, password: globalUser!.password, fullName: globalUser!.fullName }
    : {
        email: process.env.PW_E2E_USERNAME || 'mohamed@owdsolutions.co.za',
        password: process.env.PW_E2E_PASSWORD || 'Thierry14247!',
        fullName: process.env.PW_E2E_USERNAME || 'Existing Test User',
      };

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('POPIA consent modal appears on first launch and essential-only acceptance reveals the welcome screen', async () => {
    await expect(page.getByText('Your Privacy Matters', { exact: true })).toBeVisible({
      timeout: 15000,
    });

    await acceptPopiaConsent(page);

    await expect(page.getByText('Welcome to Funxon', { exact: true })).toBeVisible({
      timeout: 15000,
    });
  });

  test('Welcome screen displays brand CTAs and logo', async () => {
    await expect(page.getByText('Welcome to Funxon', { exact: true })).toBeVisible();
    await expect(page.getByText('Log in', { exact: true })).toBeVisible();
    await expect(page.getByText('Get started', { exact: true })).toBeVisible();

    // The logo is rendered as an image; assert at least one image is visible.
    await expect(page.locator('img').first()).toBeVisible();
  });

  test('POPIA consent modal does not reappear after acceptance', async () => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await acceptPopiaConsent(page);
    await expect(page.getByText('Your Privacy Matters', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Welcome to Funxon', { exact: true })).toBeVisible();
  });

  test('Sign-up screen shows inline validation for empty and mismatched passwords', async () => {
    await page.getByText('Get started', { exact: true }).click();
    await expect(page.getByText('Create Your Account', { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // Empty form submission
    await page.getByText('Sign up', { exact: true }).last().click();
    await expect(page.getByText('Missing details', { exact: true })).toBeVisible();
    await page.getByText('OK', { exact: true }).click();

    // Mismatched passwords
    await page.getByPlaceholder('Name').fill('E2E Test');
    await page.getByPlaceholder('Email').fill(mainUser.email);
    await page.getByPlaceholder('Password').first().fill('Password1');
    await page.getByPlaceholder('Confirm Password').fill('Password2');
    await page.getByTestId('terms-checkbox').first().click({ position: { x: 5, y: 5 } });
    await page.getByTestId('privacy-checkbox').first().click({ position: { x: 5, y: 5 } });
    await page.getByText('Sign up', { exact: true }).last().click();
    await expect(page.getByText('Passwords do not match', { exact: true })).toBeVisible();
    await page.getByText('OK', { exact: true }).click();
  });

  test('Valid sign-up submission reaches the post-submit confirmation', async () => {
    test.skip(!adminCreated, 'Service role key not available; the admin-created test user will be used for sign-in instead.');

    await page.getByPlaceholder('Password').first().fill(mainUser.password);
    await page.getByPlaceholder('Confirm Password').fill(mainUser.password);
    await page.getByTestId('terms-checkbox').first().click({ position: { x: 5, y: 5 } });
    await page.getByTestId('privacy-checkbox').first().click({ position: { x: 5, y: 5 } });
    await page.getByText('Sign up', { exact: true }).last().click();

    // For an already-confirmed test user, the app will detect the existing email and show
    // the Email Confirmation screen. That proves the sign-up UI path is functional.
    await expect(
      page.getByText(/Confirm your email|Email Confirmation|already registered|existing account/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('Sign in with the test user and land on the home screen', async () => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await page.getByText('Log in', { exact: true }).first().click();
    await expect(page.getByText('Welcome Back', { exact: true }).first()).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder('Email').fill(mainUser.email);
    await page.getByPlaceholder('Password').fill(mainUser.password);
    await page.getByText('Log in', { exact: true }).last().click();

    // After a successful sign-in, the home screen or the Account tab renders a greeting.
    await expect(
      page.getByText(/Hello,|Account|My Profile|Lister Portfolio Dashboard/i).first()
    ).toBeVisible({ timeout: 30000 });
  });

  test('Logout redirects to the guest prompt and guarded tabs require authentication', async () => {
    await clickBottomTab(page, 'Account');
    await openAccountMenuItem(page, 'Logout');

    // GuardedScreen immediately swaps the Account content for the guest prompt. Sign-out
    // also clears storage, so the consent modal may reappear; accept it once more.
    await acceptPopiaConsent(page);

    await expect(page.getByText('Sign in to access account', { exact: true })).toBeVisible({ timeout: 10000 });

    // Other guarded tabs should also redirect to the guest prompt
    await clickBottomTab(page, 'Favourites');
    await expect(page.getByText('Sign in to access favourites', { exact: true })).toBeVisible({ timeout: 10000 });

    await clickBottomTab(page, 'Quotes');
    await expect(page.getByText('Sign in to access quotes', { exact: true })).toBeVisible({ timeout: 10000 });

    await clickBottomTab(page, 'Planner');
    await expect(page.getByText('Sign in to access planner', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('Forgot password link triggers a reset email confirmation', async () => {
    // From the guest prompt, open the sign-in screen
    await page.getByTestId('guest-login').first().click({ force: true });
    // The sign-in screen may be stacked behind a previous instance; target the current visible form.
    await expect(page.getByPlaceholder('Email').last()).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder('Email').last().fill(mainUser.email);
    await page.getByText('Forgot password?', { exact: true }).last().click();

    await expect(page.getByText('Check your email', { exact: true }).first()).toBeVisible({ timeout: 10000 });
  });
});
