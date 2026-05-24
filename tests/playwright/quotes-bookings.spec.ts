import { test, expect } from '@playwright/test';
import {
  goToWelcomeFromHomeSearch,
  loginFromWelcome,
  createMockAssets,
  cleanupMockAssets,
  supabase,
} from './helpers';

// Clean up assets before all tests
test.beforeAll(async () => {
  createMockAssets();
});

test.afterAll(async () => {
  cleanupMockAssets();
});

/**
 * Helper to perform a search and open the first listing card.
 */
async function openFirstListing(page: any) {
  // Navigate to Discover screen via Search tab
  const searchTab = page.getByRole('button', { name: /Search/i }).last();
  await expect(searchTab).toBeVisible();
  await searchTab.click();

  // Wait for search input and perform a generic query
  const searchInput = page.locator('input[placeholder*=\"Search\"]').first();
  await expect(searchInput).toBeVisible();
  await searchInput.fill('test');
  await searchInput.press('Enter');

  // Wait for results and click the first card
  const firstCard = page.locator('[data-testid*=\"card\"], .vendor-card, .venue-card').first();
  await expect(firstCard).toBeVisible({ timeout: 10000 });
  await firstCard.click();
}

/**
 * Test the vendor quote request flow.
 */
test('Vendor: request a quote and verify backend', async ({ page }) => {
  // Login
  await goToWelcomeFromHomeSearch(page);
  await loginFromWelcome(page);

  // Open a vendor profile (assumes first result is a vendor)
  await openFirstListing(page);

  // Click Request Quote button
  const requestQuoteBtn = page.getByText('Request Quote', { exact: true }).first();
  await expect(requestQuoteBtn).toBeVisible();
  await requestQuoteBtn.click();

  // Fill the quote form
  await page.getByPlaceholder('Your full name').fill('E2E Tester');
  await page.getByPlaceholder('you@example.com').fill('e2e.tester@example.com');
  await page.getByPlaceholder('Phone number (optional)').fill('0821234567');
  await page.getByPlaceholder('Event details (optional)').fill('Birthday party, 50 guests');

  // Submit
  const submitBtn = page.getByRole('button', { name: /Submit quote request/i }).first();
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  // Expect success alert/message
  await expect(page.getByText(/Quote requested/i)).toBeVisible({ timeout: 10000 });

  // Backend verification using Supabase client
  const cleanEmail = 'e2e.tester@example.com';
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: process.env.PW_E2E_PASSWORD,
  });
  expect(authData.user).toBeDefined();

  const { data: quote, error } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('email', cleanEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  expect(error).toBeNull();
  expect(quote).toBeDefined();
  expect(quote?.event_details).toContain('Birthday party');
});

/**
 * Test the venue tour booking flow.
 */
test('Venue: book a tour and verify backend', async ({ page }) => {
  // Login
  await goToWelcomeFromHomeSearch(page);
  await loginFromWelcome(page);

  // Open a venue profile (assumes first result is a venue)
  await openFirstListing(page);

  // Click Book Venue Tour button
  const bookTourBtn = page.getByText('Book Venue Tour', { exact: true }).first();
  await expect(bookTourBtn).toBeVisible();
  await bookTourBtn.click();

  // Fill booking form
  await page.getByPlaceholder('Your full name').fill('E2E Tester');
  await page.getByPlaceholder('you@example.com').fill('e2e.tester@example.com');
  await page.getByPlaceholder('Phone number').fill('0821234567');

  // Open date picker and select tomorrow's date
  await page.getByText('Preferred Date', { exact: true }).click();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
  await page.getByLabel('Choose date').fill(dateString);

  // Optional message
  await page.getByPlaceholder('Any specific questions or requests?').fill('Looking forward to the tour');

  // Submit booking
  const submitBtn = page.getByRole('button', { name: /Request Tour/i }).first();
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  // Expect success alert/message
  await expect(page.getByText(/Tour Requested/i)).toBeVisible({ timeout: 10000 });

  // Backend verification
  const cleanEmail = 'e2e.tester@example.com';
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: process.env.PW_E2E_PASSWORD,
  });
  expect(authData.user).toBeDefined();

  const { data: booking, error } = await supabase
    .from('venue_tour_bookings')
    .select('*')
    .eq('requester_email', cleanEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  expect(error).toBeNull();
  expect(booking).toBeDefined();
  expect(booking?.requested_date).toBe(dateString);
});
