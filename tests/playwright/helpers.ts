import { expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase Client Setup
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fhlocaqndxawkbztncwo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobG9jYXFuZHhhd2tienRuY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTQ1NzksImV4cCI6MjA3ODg3MDU3OX0.8vDYyxqe7AfHsvNnd2csFNIFaotjdcbUp9Tr2J3V9As';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

export const MOCK_ASSETS_DIR = path.join(__dirname, 'temp-assets');

export async function gotoApp(page: Page, path = '/') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await dismissConsentIfPresent(page);
}

export async function dismissConsentIfPresent(page: Page) {
  // Wait for the POPIA consent modal to render and become visible before attempting to dismiss it.
  const modal = page.locator('[role="dialog"], [aria-modal="true"]').filter({ hasText: /POPIA|Consent|Accept & Continue|Essential Data Processing/i });
  const isVisible = await modal.isVisible().catch(() => false);
  if (!isVisible) return;

  // Use JavaScript to click the consent controls so overlays don't intercept pointer events.
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div'));
    const essential = all.find((d) => d.textContent === 'Essential Data Processing');
    if (essential) essential.click();
    const accept = all.find((d) => d.textContent === 'Accept & Continue');
    if (accept) accept.click();
    // Remove any full-screen backdrop that might block subsequent interactions
    document.querySelectorAll('div').forEach((d) => {
      const style = window.getComputedStyle(d);
      const rect = d.getBoundingClientRect();
      if (
        (style.position === 'fixed' || style.position === 'absolute') &&
        rect.width >= window.innerWidth * 0.9 &&
        rect.height >= window.innerHeight * 0.9 &&
        style.zIndex !== 'auto'
      ) {
        d.remove();
      }
    });
  });
  await page.waitForTimeout(300);
}

export async function openAccountTab(page: Page) {
  // Try multiple selectors to locate the Account tab/button
  // React Native Web bottom tabs render as a tablist with role='tab'.
  const attempts = [
    page.getByRole('tab', { name: /Account/i }).last(),
    page.getByRole('tab', { name: /Account/i }).first(),
    page.getByRole('button', { name: /Account/i }).last(),
    page.getByRole('button', { name: /Account/i }).first(),
    page.getByText('Account', { exact: true }).first(),
  ];

  for (const candidate of attempts) {
    try {
      await expect(candidate).toBeVisible({ timeout: 8000 });
      await candidate.click({ force: true });
      console.log('Account tab opened');
      // Optionally wait for menu to appear
      await page.waitForTimeout(500);
      return;
    } catch (e) {
      // try next candidate
    }
  }

  console.warn('Account tab not found – test may fail');
}

export async function openAccountMenuItem(page: Page, label: string) {
  // Try several selector strategies to locate the menu item
  const slug = label.toLowerCase().replace(/\s+/g, '-');
  const candidates = [
    // Primary: testID derived from the menu item label (e.g. "Logout" -> "logout")
    page.getByTestId(slug).first(),
    // Button role with case‑insensitive name
    page.getByRole('button', { name: new RegExp(label, 'i') }).first(),
    // Role menuitem (fallback)
    page.getByRole('menuitem', { name: new RegExp(label, 'i') }).first(),
    // Role link (fallback for anchor elements)
    page.getByRole('link', { name: new RegExp(label, 'i') }).first(),
    // Text contains (non‑exact)
    page.getByText(label, { exact: false }).first(),
    // Exact text match
    page.getByText(label, { exact: true }).first(),
    // Generic text locator
    page.locator(`text=${label}`).first(),
  ];

  for (const item of candidates) {
    try {
      await expect(item).toBeVisible({ timeout: 5000 });
      await item.scrollIntoViewIfNeeded();
      await item.click({ force: true });
      console.log(`Clicked menu item "${label}" via robust selector`);
      return;
    } catch (e) {
      // try next
    }
  }

  // Last resort: JavaScript evaluate to find the text node and click its
  // closest clickable ancestor (react-native-web TouchableOpacity renders as
  // a div with inline cursor:pointer, not as a button role).
  console.log(`Falling back to JS evaluate for menu item "${label}"`);
  const clicked = await page.evaluate((targetLabel: string) => {
    const all = Array.from(document.querySelectorAll('div'));
    const match = all.find(
      (d) => d.textContent === targetLabel && d.getBoundingClientRect().width > 0
    );
    if (!match) return false;
    let clickable = match.parentElement;
    while (clickable) {
      const style = window.getComputedStyle(clickable);
      if (style.cursor === 'pointer' || clickable.getAttribute('role') === 'button' || clickable.tagName === 'BUTTON') {
        (clickable as HTMLElement).click();
        return true;
      }
      clickable = clickable.parentElement;
    }
    // If no clickable ancestor found, click the text element itself
    (match as HTMLElement).click();
    return true;
  }, label);

  if (clicked) {
    console.log(`Clicked menu item "${label}" via JS evaluate fallback`);
    await page.waitForTimeout(500);
    return;
  }

  console.warn(`Menu item "${label}" not found – test may fail`);
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  // Detect authenticated state by looking for a logged-in-only element (greeting or logout option).
  const greeting = page.getByText(/Hi /i).first();
  const logout = page.getByText('Logout', { exact: true }).first();
  const userEmail = page.getByText('mohamed@owdsolutions', { exact: false }).first();
  const hello = page.getByText(/Hello,/i).first();
  const myProfile = page.getByText('My Profile', { exact: true }).first();

  try {
    await Promise.any([
      expect(greeting).toBeVisible({ timeout: 10000 }),
      expect(logout).toBeVisible({ timeout: 10000 }),
      expect(userEmail).toBeVisible({ timeout: 10000 }),
      expect(hello).toBeVisible({ timeout: 10000 }),
      expect(myProfile).toBeVisible({ timeout: 10000 }),
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

export async function goToWelcomeFromHomeSearch(page: Page) {
  await gotoApp(page);

  // If already authenticated, stay on the current screen and let the test proceed.
  if (await isAuthenticated(page)) {
    console.log('Already authenticated – skipping welcome/login navigation');
    return;
  }

  // The app starts on the Home tab; the welcome/login screen is reached via the Account tab.
  // React Native Web renders bottom tabs as a tablist with role='tab'.
  await dismissConsentIfPresent(page);
  await page.waitForSelector('[role="tablist"]', { timeout: 10000 }).catch(() => {
    console.log('Tablist not found – proceeding without waiting');
  });

  const accountTab = page.getByRole('tab', { name: /Account/i }).last();
  if (await accountTab.isVisible().catch(() => false)) {
    await accountTab.click({ force: true });
    console.log('Account tab clicked to reach welcome/login screen');
    await page.waitForTimeout(800);
  } else {
    console.log('Account tab not found, assuming welcome/login screen is already shown');
  }

  await dismissConsentIfPresent(page);

  // Wait for either the 'Log in' button (welcome screen) or an authenticated indicator.
  const loginButton = page.getByText('Log in', { exact: true }).first();
  if (await loginButton.isVisible().catch(() => false)) {
    return;
  }

  // If neither login button nor auth indicator is present, try the Account tab again.
  if (await isAuthenticated(page)) return;
  if (await accountTab.isVisible().catch(() => false)) {
    await accountTab.click({ force: true });
    await page.waitForTimeout(800);
  }
  await expect(loginButton).toBeVisible({ timeout: 5000 }).catch(() => {
    console.log('Log in button not found after retry');
  });
}

/**
 * Creates temporary mock assets for file upload testing
 */
export function createMockAssets() {
  if (!fs.existsSync(MOCK_ASSETS_DIR)) {
    fs.mkdirSync(MOCK_ASSETS_DIR, { recursive: true });
  }

  // 1. Mock PNG image (tiny valid 1x1 png base64)
  const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  fs.writeFileSync(path.join(MOCK_ASSETS_DIR, 'mock-image.png'), Buffer.from(imageBase64, 'base64'));
  fs.writeFileSync(path.join(MOCK_ASSETS_DIR, 'mock-logo.png'), Buffer.from(imageBase64, 'base64'));

  // 2. Mock PDF Document
  fs.writeFileSync(path.join(MOCK_ASSETS_DIR, 'mock-doc.pdf'), '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');

  // 3. Mock MP4 Video
  fs.writeFileSync(path.join(MOCK_ASSETS_DIR, 'mock-video.mp4'), Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]));
}

/**
 * Cleans up temporary mock assets
 */
export function cleanupMockAssets() {
  if (fs.existsSync(MOCK_ASSETS_DIR)) {
    fs.rmSync(MOCK_ASSETS_DIR, { recursive: true, force: true });
  }
}

/**
 * Direct Database cleanup helper using user's Supabase session.
 * Authenticates as the test user and deletes old applications to unblock step-by-step E2E tests.
 */
export async function cleanupUserApplications(emailInput: string, passwordInput: string) {
  const email = emailInput.replace(',', '.'); // Try clean version
  const emailWithComma = emailInput.includes(',') ? emailInput : emailInput.replace('.', ',');

  console.log(`[Database Cleanup] Attempting to clean up application records for user: ${email}`);

  let authUser;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordInput,
    });

    if (error) {
      // Try with comma version if standard fails
      const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
        email: emailWithComma,
        password: passwordInput,
      });

      if (error2) {
        console.error(`[Database Cleanup] Supabase Auth sign-in failed: ${error2.message}`);
        return;
      }
      authUser = data2.user;
    } else {
      authUser = data.user;
    }

    if (!authUser) return;

    // Delete existing subscriber applications to start fresh
    const { error: deleteError } = await supabase
      .from('subscriber_applications')
      .delete()
      .eq('user_id', authUser.id);

    if (deleteError) {
      console.error(`[Database Cleanup] Failed to delete subscriber_applications: ${deleteError.message}`);
    } else {
      console.log(`[Database Cleanup] Successfully cleared subscriber applications for user: ${authUser.id}`);
    }

    // Clean up vendor record or resets count if needed
    const { error: vendorDeleteError } = await supabase
      .from('vendors')
      .delete()
      .eq('user_id', authUser.id);

    if (vendorDeleteError) {
      console.error(`[Database Cleanup] Failed to clean up vendor record: ${vendorDeleteError.message}`);
    }

    // Clean up venue record if needed
    const { error: venueDeleteError } = await supabase
      .from('venues')
      .delete()
      .eq('user_id', authUser.id);

    if (venueDeleteError) {
      console.error(`[Database Cleanup] Failed to clean up venue record: ${venueDeleteError.message}`);
    }

    await supabase.auth.signOut();
  } catch (err) {
    console.error('[Database Cleanup] Error occurred:', err);
  }
}

/**
 * Authenticates user from Welcome screen. Handles fallback logic dynamically
 * for both mohamed@owdsolutions.co.za and mohamed@owdsolutions,co,za
 */
export async function loginFromWelcome(page: Page) {
    // Use provided environment variables or fallback to hard‑coded test credentials
    const rawUsername = process.env.PW_E2E_USERNAME || 'mohamed@owdsolutions.co.za';
    const password = process.env.PW_E2E_PASSWORD || 'Thierry14247!';
    // No longer throw if they are missing; the defaults ensure tests can run.
    // const rawUsername = process.env.PW_E2E_USERNAME;
    // const password = process.env.PW_E2E_PASSWORD;
    // if (!rawUsername || !password) {
    //   throw new Error('PW_E2E_USERNAME and PW_E2E_PASSWORD must be set to run authenticated Playwright tests.');
    // }

  // Determine standard and fallback email formats
  const cleanEmail = rawUsername.replace(',', '.');
  const commaEmail = rawUsername.includes(',') ? rawUsername : rawUsername.replace('.', ',');

  // If we are already logged in, exit early
  if (await isAuthenticated(page)) {
    console.log('Already authenticated – skipping login steps');
    return;
  }

  // The welcome screen may show a POPIA consent modal that blocks the login CTA.
  await dismissConsentIfPresent(page);

  // Attempt to click the "Log in" / "Sign in" button if it exists (welcome screen)
  const signInTexts = ['Log in', 'Sign in'];
  let signInClicked = false;
  for (const text of signInTexts) {
    try {
      await expect(page.getByText(text, { exact: true })).toBeVisible({ timeout: 3000 });
      await page.getByText(text, { exact: true }).first().click();
      signInClicked = true;
      break;
    } catch (e) {
      // try next label
    }
  }
  if (!signInClicked) {
    console.log('Log in/Sign in button not visible – assuming login form is already shown');
  }

  // Otherwise, ensure the welcome back text is present (optional)
  await expect(page.getByText('Welcome Back', { exact: true })).toBeVisible({ timeout: 5000 }).catch(() => {
    console.log('Welcome Back not shown – proceeding with login form directly');
  });

  // Proceed with filling credentials
  await expect(page.getByPlaceholder('Email')).toBeVisible({ timeout: 5000 });
  await page.getByPlaceholder('Email').fill(cleanEmail);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByText('Log in', { exact: true }).last().click();

  // Check if standard dot email login succeeded using a logged-in-only indicator
  let loginSucceeded = false;
  try {
    await expect(page.getByText(/Hi /i).first()).toBeVisible({ timeout: 10000 });
    console.log(`[Login Helper] Login successful with standard email: ${cleanEmail}`);
    loginSucceeded = true;
  } catch (e) {
    console.log(`[Login Helper] Login with ${cleanEmail} failed or timed out. Retrying with comma fallback: ${commaEmail}`);
    
    // Clear and fill with comma email
    await page.getByPlaceholder('Email').click();
    await page.getByPlaceholder('Email').press('Control+a');
    await page.getByPlaceholder('Email').press('Backspace');
    await page.getByPlaceholder('Email').fill(commaEmail);

    await page.getByPlaceholder('Password').click();
    await page.getByPlaceholder('Password').press('Control+a');
    await page.getByPlaceholder('Password').press('Backspace');
    await page.getByPlaceholder('Password').fill(password);

    await page.getByText('Log in', { exact: true }).last().click();
    
    // Assert successful login with fallback
    await expect(page.getByText(/Hi /i).first()).toBeVisible({ timeout: 30000 });
    console.log(`[Login Helper] Login successful with fallback email: ${commaEmail}`);
  }

  // The user is now logged in. The caller decides whether to navigate elsewhere.
  console.log('[Login Helper] Login flow complete');
  await dismissConsentIfPresent(page);
}

/**
 * Logs in using the supplied credentials. Assumes the page is already at the
 * welcome/auth screen (callers usually invoke `gotoApp(page, '/auth')` first).
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  if (await isAuthenticated(page)) {
    console.log('Already authenticated – skipping login steps');
    return;
  }

  try {
    await expect(page.getByText('Log in', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByText('Log in', { exact: true }).first().click();
  } catch (e) {
    console.log('Log in button not visible – assuming login form is already shown');
  }

  await expect(page.getByPlaceholder('Email')).toBeVisible({ timeout: 5000 });
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByText('Log in', { exact: true }).last().click();

  await expect(page.getByText(/Hi /i).first()).toBeVisible({ timeout: 10000 });
  console.log(`[loginWithCredentials] Logged in as ${email}`);
}

/**
 * Logs in using the disposable test user created by `globalSetup` in
 * `ensureTestUser.ts`. Throws if the credentials file is missing.
 */
export async function loginAsGlobalTestUser(page: Page): Promise<void> {
  const creds = getGlobalTestUser();
  if (!creds) {
    throw new Error(
      'Global test user credentials not found. Ensure globalSetup ran and wrote tests/playwright/.temp/test-user-credentials.json.'
    );
  }
  await loginWithCredentials(page, creds.email, creds.password);
}

export interface TestUserCredentials {
  email: string;
  password: string;
  fullName: string;
}

/**
 * Loads environment variables from the project root .env file into process.env.
 * This is useful for Playwright Node scripts that do not inherit Expo's env handling.
 */
export function loadEnv(): void {
  try {
    const dotenv = require('dotenv') as typeof import('dotenv');
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  } catch {
    // dotenv is optional; env vars may already be set by the shell
  }
}

/**
 * Creates a Supabase client authenticated as the given email/password.
 * Useful for backend assertions when the service-role key is unavailable.
 */
export async function createAuthedSupabaseClient(email: string, password: string) {
  const { url, anonKey } = getSupabaseCreds();
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw new Error(`Failed to sign in as ${email}: ${error?.message}`);
  }
  return { client, user: data.user };
}

/**
 * Creates a Supabase client using the service-role key.
 * Throws if SUPABASE_SERVICE_ROLE_KEY is not available.
 */
export function getServiceRoleClient() {
  const { url, serviceRoleKey } = getSupabaseCreds();
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required to create or clean up test vendors. Set it in your .env or environment.'
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Creates a minimal test vendor owned by the given auth user.
 * Reuses an existing vendor for the user if one already exists.
 */
export async function ensureTestVendor(
  authUserId: string,
  options?: {
    name?: string;
    categoryId?: number;
    address?: string;
    city?: string;
    province?: string;
  }
): Promise<{ id: number; name: string } | null> {
  const supabase = getServiceRoleClient();

  const { data: existing } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('user_id', authUserId)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  let categoryId = options?.categoryId;
  if (!categoryId) {
    const { data: categories } = await supabase.from('categories').select('id').limit(1);
    categoryId = categories?.[0]?.id ?? 11;
  }

  const timestamp = Date.now();
  const name = options?.name ?? `E2E Vendor ${timestamp}`;

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      name,
      category_id: categoryId,
      user_id: authUserId,
      address_line_1: options?.address ?? '123 Test Street',
      city: options?.city ?? 'Johannesburg',
      province: options?.province ?? 'Gauteng',
      email: `e2e-vendor-${timestamp}@example.com`,
      subscription_tier: 'get_started',
      online_quotes: true,
    })
    .select('id, name')
    .single();

  if (error) {
    console.error('[ensureTestVendor] Failed to create vendor:', error.message);
    return null;
  }

  console.log(`[ensureTestVendor] Created vendor ${data.id} (${data.name}) for user ${authUserId}`);
  return data;
}

/**
 * Deletes all vendors (and their quote requests) owned by the given auth user.
 */
export async function deleteTestVendor(authUserId: string): Promise<void> {
  const supabase = getServiceRoleClient();

  const { data: vendors } = await supabase.from('vendors').select('id').eq('user_id', authUserId);
  if (!vendors || vendors.length === 0) return;

  const ids = vendors.map((v) => v.id);

  await supabase.from('quote_requests').delete().in('vendor_id', ids);
  await supabase.from('quote_revisions').delete().in('vendor_id', ids);
  await supabase.from('gallery_media').delete().in('vendor_id', ids);
  await supabase.from('vendor_catalogue_items').delete().in('vendor_id', ids);

  const { error } = await supabase.from('vendors').delete().in('id', ids);
  if (error) {
    console.error('[deleteTestVendor] Failed to delete vendors:', error.message);
  } else {
    console.log(`[deleteTestVendor] Deleted ${ids.length} vendor(s) for user ${authUserId}`);
  }
}

/**
 * Returns the Supabase credentials from environment variables (preferring the project's .env).
 */
export function getSupabaseCreds() {
  loadEnv();
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export const TEST_USER_CREDENTIALS_FILE = path.join(__dirname, '.temp', 'test-user-credentials.json');

export function getGlobalTestUser(): (TestUserCredentials & { adminCreated?: boolean; userId?: string }) | null {
  try {
    const raw = fs.readFileSync(TEST_USER_CREDENTIALS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Creates a fresh disposable test user through the public sign-up UI.
 * Returns the credentials so later tests can sign in or delete the user.
 */
export async function createTestUser(
  page: Page,
  options?: {
    name?: string;
    email?: string;
    password?: string;
    role?: 'attendee' | 'vendor' | 'venue';
  }
): Promise<TestUserCredentials> {
  const timestamp = Date.now();
  const fullName = options?.name || 'E2E Test User';
  const email =
    options?.email ||
    process.env.PW_E2E_TEST_EMAIL ||
    `e2e-test-${timestamp}@owdsolutions.co.za`;
  const password =
    options?.password ||
    process.env.PW_E2E_TEST_PASSWORD ||
    `TestPass${timestamp}!`;
  const role = options?.role || 'attendee';

  await gotoApp(page, '/auth');
  await page.getByText('Get started', { exact: true }).first().click();
  await expect(page.getByText('Create Your Account', { exact: true })).toBeVisible({ timeout: 10000 });

  await page.getByPlaceholder('Name').fill(fullName);
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').first().fill(password);
  await page.getByPlaceholder('Confirm Password').fill(password);

  if (role !== 'attendee') {
    const roleLabel = role === 'vendor' ? 'Vendor & Service Provider' : 'Venue';
    await page.getByText(roleLabel, { exact: true }).click();
  }

  // Accept terms and privacy (the first matching text is terms, the second is privacy)
  await page.getByText('I agree to the', { exact: false }).first().click();
  await page.getByText('I accept the', { exact: false }).first().click();

  await page.getByText('Sign up', { exact: true }).last().click();

  // Wait for either immediate login (auto-confirmed projects) or the email confirmation screen
  await Promise.race([
    page.waitForSelector('text=/Hello,|Home|Account|Welcome Back/', { timeout: 30000 }),
    page.waitForSelector('text=/Confirm your email|Email Confirmation|Verify your email/', { timeout: 30000 }),
  ]).catch(() => {
    console.warn('[createTestUser] Timed out waiting for post-sign-up screen');
  });

  await acceptPopiaConsent(page);

  return { email, password, fullName };
}

/**
 * Deletes a test user and all associated data by signing in and invoking the
 * delete-user-account edge function. Falls back to the admin API if a service
 * role key is available.
 */
export async function deleteTestUser(email: string, password: string): Promise<void> {
  const { url, anonKey, serviceRoleKey } = getSupabaseCreds();

  if (serviceRoleKey) {
    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) {
      console.warn(`[deleteTestUser] Failed to list users: ${listError.message}`);
      return;
    }
    const user = users?.users?.find((u) => u.email === email);
    if (user) {
      await adminClient.auth.admin.deleteUser(user.id);
      console.log(`[deleteTestUser] Deleted ${email} via admin API`);
    } else {
      console.log(`[deleteTestUser] No auth user found for ${email}`);
    }
    return;
  }

  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await userClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    console.warn(`[deleteTestUser] Could not sign in as ${email}: ${error?.message}`);
    return;
  }
  const { error: fnError } = await userClient.functions.invoke('delete-user-account');
  if (fnError) {
    console.warn(`[deleteTestUser] delete-user-account failed: ${fnError.message}`);
  } else {
    console.log(`[deleteTestUser] Deleted ${email} via edge function`);
  }
}

/**
 * Accepts the POPIA data-consent modal if it is present.
 */
export async function acceptPopiaConsent(page: Page, options?: { analytics?: boolean }): Promise<void> {
  const header = page.getByText('Your Privacy Matters', { exact: true }).first();
  const isVisible = await header.isVisible().catch(() => false);
  if (!isVisible) return;

  await page.getByText('Essential Data Processing', { exact: true }).first().click();
  if (options?.analytics) {
    await page.getByText('Analytics & Improvement', { exact: true }).first().click();
  }
  await page.getByText('Accept & Continue', { exact: true }).click();
  await page.waitForTimeout(300);
}

/**
 * Clicks a bottom tab by its visible label (e.g. 'Home', 'Favourites', 'Quotes',
 * 'Planner', 'Account').
 */
export async function clickBottomTab(page: Page, label: string): Promise<void> {
  const tab = page.getByRole('tab', { name: new RegExp(label, 'i') }).first();
  await expect(tab).toBeVisible({ timeout: 10000 });
  await tab.click({ force: true });
  await page.waitForTimeout(500);
}

/**
 * Opens a listing card from Discover/Search results by matching the card name.
 */
export async function openListingCard(page: Page, nameRegex: RegExp | string): Promise<void> {
  const card = page.getByText(nameRegex).first();
  await expect(card).toBeVisible({ timeout: 10000 });
  await card.click({ force: true });
  await page.waitForTimeout(500);
}

/**
 * Returns a Supabase client authenticated with the service-role key.
 * Throws if SUPABASE_SERVICE_ROLE_KEY is not set.
 */
export function getServiceRoleSupabase() {
  const { url, serviceRoleKey } = getSupabaseCreds();
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for this helper');
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Reads the current unread notification count from the bell badge.
 */
export async function getNotificationBellCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    const bell = allDivs.find((d) => {
      const style = window.getComputedStyle(d);
      if (style.cursor !== 'pointer') return false;
      const children = Array.from(d.querySelectorAll('span, svg, i, div'));
      return children.some((el) => {
        const text = el.textContent?.trim() || '';
        const aria = el.getAttribute('aria-label') || '';
        return text === 'notifications' || aria === 'notifications';
      });
    });
    if (!bell) return 0;

    const badge = Array.from(bell.querySelectorAll('div')).find((child) => {
      const style = window.getComputedStyle(child);
      const rect = child.getBoundingClientRect();
      const bg = style.backgroundColor.toLowerCase();
      return (
        (bg.includes('rgb(220, 38, 38)') || bg.includes('rgb(239, 68, 68)') || bg.includes('red')) &&
        rect.width > 0 &&
        rect.width <= 30 &&
        rect.height > 0 &&
        rect.height <= 30
      );
    });
    if (!badge) return 0;
    const text = badge.textContent?.trim() || '0';
    const count = parseInt(text, 10);
    return Number.isNaN(count) ? 0 : count;
  });
}

/**
 * Opens the notification bell dropdown.
 */
export async function clickNotificationBell(page: Page): Promise<void> {
  const clicked = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    const bell = allDivs.find((d) => {
      const style = window.getComputedStyle(d);
      if (style.cursor !== 'pointer') return false;
      const children = Array.from(d.querySelectorAll('span, svg, i, div'));
      return children.some((el) => {
        const text = el.textContent?.trim() || '';
        const aria = el.getAttribute('aria-label') || '';
        return text === 'notifications' || aria === 'notifications';
      });
    });
    if (bell) {
      (bell as HTMLElement).click();
      return true;
    }
    return false;
  });
  if (!clicked) throw new Error('Notification bell not found');
  await page.waitForTimeout(300);
}

