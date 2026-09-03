import { test, expect } from '@playwright/test';
import {
  dismissConsentIfPresent,
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
 * Helper to navigate to Discover via the top header "Vendors" button,
 * perform a search, and open the first listing card.
 */
async function openFirstListing(page: any) {
  await dismissConsentIfPresent(page);

  // Use the top header "Vendors" button to reach Discover (same pattern as discover.spec.ts)
  const vendorsButton = page.getByText('Vendors', { exact: true }).first();
  if (await vendorsButton.isVisible().catch(() => false)) {
    await vendorsButton.click({ force: true });
    await page.waitForTimeout(400);
  } else {
    // Fallback to direct JavaScript click if Playwright cannot target the header
    await page.evaluate(() => {
      const vendors = Array.from(document.querySelectorAll('div')).find(
        (d) => d.textContent === 'Vendors' && d.getBoundingClientRect().width > 0
      );
      if (vendors) {
        let clickable = vendors.parentElement;
        while (clickable && !clickable.getAttribute('tabindex') && !clickable.getAttribute('role')) {
          clickable = clickable.parentElement;
        }
        (clickable || vendors).click();
      }
    });
    await page.waitForTimeout(400);
  }

  // Wait for search input and perform a generic query
  const searchInput = page.locator('input[placeholder*=\"Search\"]').first();
  await expect(searchInput).toBeVisible();
  await searchInput.fill('test');
  await searchInput.press('Enter');

  // Wait for results and click the first card.
  // RN Web doesn't render data-testid or CSS class names on cards — cards are
  // divs with inline cursor:pointer containing the business name text.
  // Use JS evaluate to find and click the first clickable result card.
  await expect(page.getByText(/Search results|Showing.*listing/i).first()).toBeVisible({ timeout: 10000 });
  await page.evaluate(() => {
    const resultText = Array.from(document.querySelectorAll('div')).find(
      (d) => /Search results|Showing.*listing/i.test(d.textContent || '') && d.getBoundingClientRect().width > 0
    );
    if (!resultText) return;
    // The card containers are siblings after the results header — find the first
    // div with cursor:pointer that appears after the results header.
    const allDivs = Array.from(document.querySelectorAll('div'));
    const headerIdx = allDivs.indexOf(resultText);
    for (let i = headerIdx + 1; i < allDivs.length; i++) {
      const el = allDivs[i];
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (style.cursor === 'pointer' && rect.width > 50 && rect.height > 50) {
        (el as HTMLElement).click();
        return;
      }
    }
  });
  await page.waitForTimeout(500);
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

  // Click Book a Tour button
  const bookTourBtn = page.getByText('Book a Tour', { exact: true }).first();
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
