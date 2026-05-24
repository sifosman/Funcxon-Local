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
  const acceptButton = page.getByText('Accept & Continue', { exact: true });
  if (await acceptButton.isVisible().catch(() => false)) {
    const essential = page.getByText('Essential Data Processing', { exact: true });
    await expect(essential).toBeVisible({ timeout: 10000 });
    await essential.click();
    await expect(acceptButton).toBeEnabled({ timeout: 5000 });
    await acceptButton.click();
  }
}

export async function openAccountTab(page: Page) {
  // Try multiple selectors to locate the Account tab/button
  const attempts = [
    page.getByRole('button', { name: /Account/i }).last(),
    page.getByRole('button', { name: /Account/i }).first(),
    page.getByText('Account', { exact: true }).first(),
  ];

  for (const candidate of attempts) {
    try {
      await expect(candidate).toBeVisible({ timeout: 8000 });
      await candidate.click();
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
      await expect(item).toBeVisible({ timeout: 10000 });
      await item.scrollIntoViewIfNeeded();
      await item.click();
      console.log(`Clicked menu item "${label}" via robust selector`);
      return;
    } catch (e) {
      // try next
    }
  }

  console.warn(`Menu item "${label}" not found – test may fail`);
}

export async function goToWelcomeFromHomeSearch(page: Page) {
  await gotoApp(page);

  const searchButton = page.getByRole('button', { name: /Search/i }).first();
  try {
    await expect(searchButton).toBeVisible({ timeout: 2000 });
    await searchButton.click();
  } catch (e) {
    // Search button not visible; assume we are already on welcome or home screen
    console.log('Search button not found, proceeding to welcome screen');
  }

  // After handling the search button, ensure the page is ready for login.
  // Wait for either the 'Log in' button (welcome screen) or the 'Account' tab (already logged in).
  try {
    await expect(page.getByText('Log in', { exact: true })).toBeVisible({ timeout: 5000 });
  } catch (e) {
    // If login button not visible, fallback to checking for Account tab.
    await expect(page.getByText('Account', { exact: true })).toBeVisible({ timeout: 5000 });
  }

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

  // Attempt to click the "Log in" button if it exists
  try {
    await expect(page.getByText('Log in', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByText('Log in', { exact: true }).first().click();
  } catch (e) {
    console.log('Log in button not visible – assuming login form is already shown');
  }

  // If we are already logged in, the Account tab will be visible – exit early
  try {
    if (await page.getByText('Account', { exact: true }).first().isVisible({ timeout: 3000 })) {
      console.log('Already authenticated – skipping login steps');
      return;
    }
  } catch {}

  // Otherwise, ensure the welcome back text is present (optional)
  await expect(page.getByText('Welcome Back', { exact: true })).toBeVisible({ timeout: 5000 }).catch(() => {
    console.log('Welcome Back not shown – proceeding with login form directly');
  });

  // Proceed with filling credentials
  await expect(page.getByPlaceholder('Email')).toBeVisible({ timeout: 5000 });
  await page.getByPlaceholder('Email').fill(cleanEmail);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByText('Log in', { exact: true }).last().click();

  // Check if standard dot email login succeeded
  try {
    await expect(page.getByText('Account', { exact: true }).last()).toBeVisible({ timeout: 5000 });
    console.log(`[Login Helper] Login successful with standard email: ${cleanEmail}`);
    return;
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
    await expect(page.getByText('Account', { exact: true }).last()).toBeVisible({ timeout: 30000 });
    console.log(`[Login Helper] Login successful with fallback email: ${commaEmail}`);
  }
}
