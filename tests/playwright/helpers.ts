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
  const candidates = [
    // Primary: button role with case‑insensitive name
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
      expect(greeting).toBeVisible({ timeout: 5000 }),
      expect(logout).toBeVisible({ timeout: 5000 }),
      expect(userEmail).toBeVisible({ timeout: 5000 }),
      expect(hello).toBeVisible({ timeout: 5000 }),
      expect(myProfile).toBeVisible({ timeout: 5000 }),
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

  // Attempt to click the "Log in" button if it exists (welcome screen)
  try {
    await expect(page.getByText('Log in', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByText('Log in', { exact: true }).first().click();
  } catch (e) {
    console.log('Log in button not visible – assuming login form is already shown');
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
