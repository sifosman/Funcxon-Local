// WEB ONLY — deploy-web/tests/helpers.ts
import { expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fhlocaqndxawkbztncwo.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobG9jYXFuZHhhd2tienRuY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTQ1NzksImV4cCI6MjA3ODg3MDU3OX0.8vDYyxqe7AfHsvNnd2csFNIFaotjdcbUp9Tr2J3V9As';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export const TEST_USER = {
  email: process.env.PW_E2E_USERNAME || 'mohamed@owdsolutions.co.za',
  password: process.env.PW_E2E_PASSWORD || 'Thierry14247!',
};

const CONSENT_KEY = 'funxon.dataConsent.v1';

/**
 * Navigate to a path and dismiss the data consent modal if present.
 * Sets localStorage BEFORE navigation so the modal never appears.
 */
export async function gotoPage(page: Page, path = '/') {
  // Set consent localStorage before navigating so the modal never renders
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((key) => {
    try { localStorage.setItem(key, 'true'); } catch {}
  }, CONSENT_KEY);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await dismissConsent(page);
}

/**
 * Dismiss the POPIA / data consent modal if it appears.
 * The web modal shows "I Accept" and "Decline" buttons.
 */
export async function dismissConsent(page: Page) {
  // Check if the modal is visible and dismiss it
  const acceptBtn = page.getByRole('button', { name: 'I Accept', exact: true });
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await expect(acceptBtn).toBeHidden({ timeout: 3000 });
  }
}

/**
 * Sign in via the /signin page using the test user credentials.
 * After successful sign-in, the app navigates to /account.
 */
export async function signIn(page: Page, email?: string, password?: string) {
  const userEmail = email || TEST_USER.email;
  const userPassword = password || TEST_USER.password;

  // Set consent localStorage before navigating
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((key) => {
    try { localStorage.setItem(key, 'true'); } catch {}
  }, CONSENT_KEY);

  await page.goto('/signin', { waitUntil: 'domcontentloaded' });
  await dismissConsent(page);

  // Fill the sign-in form
  await page.getByPlaceholder('you@example.com').fill(userEmail);
  await page.getByPlaceholder('Enter your password').fill(userPassword);

  // Submit
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  // Wait for navigation to /account (indicates successful login)
  await page.waitForURL('**/account', { timeout: 15_000 });
}

/**
 * Sign in and return the auth user info for DB operations.
 */
export async function getAuthUser() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  if (error) throw error;
  return data.user;
}

/**
 * Sign out the current test user from Supabase.
 */
export async function signOutUser() {
  await supabase.auth.signOut();
}

/**
 * Fetch the first venue listing ID from the database for use in tests.
 */
export async function getFirstVenueId(): Promise<string> {
  const { data, error } = await supabase
    .from('venue_listings')
    .select('id')
    .limit(1)
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * Fetch the first vendor ID from the database for use in tests.
 */
export async function getFirstVendorId(): Promise<string> {
  const { data, error } = await supabase
    .from('vendors')
    .select('id')
    .limit(1)
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * Clean up planner items for a user after tests.
 */
export async function cleanupPlannerItems(userId: string) {
  await supabase.from('event_planner_items').delete().eq('user_id', userId);
}

/**
 * Clean up tour bookings created during tests.
 */
export async function cleanupTourBookings(userId: string) {
  await supabase.from('venue_tour_bookings').delete().eq('requester_user_id', userId);
}
