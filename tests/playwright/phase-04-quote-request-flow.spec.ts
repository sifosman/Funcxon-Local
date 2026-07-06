import { expect, test, type Page } from '@playwright/test';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  acceptPopiaConsent,
  clickBottomTab,
  createAuthedSupabaseClient,
  getGlobalTestUser,
  gotoApp,
  loginAsGlobalTestUser,
  loginFromWelcome,
  openListingCard,
} from './helpers';

/**
 * Navigates to the Discover screen via the header "Vendors" button and waits for it to load.
 */
async function navigateToDiscover(page: Page) {
  const vendorsNav = page.locator('[data-testid="nav-vendors"]').first();
  await expect(vendorsNav).toBeVisible({ timeout: 10000 });
  await vendorsNav.click();

  // Wait for Discover to render by looking for a known label or the search input.
  await page.waitForTimeout(800);
  await Promise.race([
    page.getByText('Searching vendors and services').first().waitFor({ state: 'visible', timeout: 15000 }),
    page.getByText('Searching all listings').first().waitFor({ state: 'visible', timeout: 15000 }),
    page.getByText('Filters', { exact: true }).first().waitFor({ state: 'visible', timeout: 15000 }),
    page.locator('input').first().waitFor({ state: 'visible', timeout: 15000 }),
  ]).catch(() => {});
  await page.waitForTimeout(300);
}

/**
 * Searches for a listing by name in Discover and opens the first result card.
 */
async function searchAndOpenListing(page: Page, name: string) {
  // Try the placeholder-based locator first, then fall back to any visible input.
  let searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
  if (!(await searchInput.isVisible().catch(() => false))) {
    searchInput = page.locator('input').first();
  }
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill(name);
  await searchInput.press('Enter');
  await page.waitForTimeout(1200);

  // Click the nearest visible clickable ancestor of the card title (the card
  // TouchableOpacity), even if the text node itself is hidden/clipped.
  const clicked = await page.evaluate((targetText: string) => {
    function isVisibleElement(el: Element): boolean {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    }
    const target = targetText.toLowerCase();
    const all = Array.from(document.querySelectorAll('div, span'));
    const match = all.find((d) => d.textContent?.trim().toLowerCase() === target);
    if (!match) return false;
    let clickable: Element | null = match.parentElement;
    while (clickable) {
      if (isVisibleElement(clickable)) {
        const style = window.getComputedStyle(clickable);
        if (style.cursor === 'pointer' || clickable.getAttribute('role') === 'button') {
          (clickable as HTMLElement).click();
          return true;
        }
      }
      clickable = clickable.parentElement;
    }
    return false;
  }, name);
  if (!clicked) throw new Error(`Could not click listing card "${name}"`);
  await page.waitForTimeout(600);
}

/**
 * Sets the event date on the quote request form. Tries several strategies because
 * React Native Web renders the date picker differently across platforms.
 */
async function pickEventDate(page: Page, dateString: string) {
  // Open the date picker
  await page.getByText('Select a date').first().click();
  await page.waitForTimeout(300);

  // Strategy 1: native HTML5 date input rendered by the web date picker
  const dateInput = page.locator('input[type="date"]').first();
  if (await dateInput.isVisible().catch(() => false)) {
    await dateInput.fill(dateString);
    await page.waitForTimeout(300);
    return;
  }

  // Strategy 2: input labelled "Choose date"
  const labeledInput = page.getByLabel('Choose date').first();
  if (await labeledInput.isVisible().catch(() => false)) {
    await labeledInput.fill(dateString);
    await page.waitForTimeout(300);
    return;
  }

  // Strategy 3: set the value via JS and dispatch a change event
  await page.evaluate((date) => {
    const input = document.querySelector('input[type="date"]') as HTMLInputElement | null;
    if (input) {
      input.value = date;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, dateString);
  await page.waitForTimeout(300);
}

/**
 * Dismisses the success alert after a quote submission.
 */
async function dismissQuoteSuccessAlert(page: Page) {
  await expect(page.getByText('Quote requested', { exact: true }).first()).toBeVisible({
    timeout: 15000,
  });
  const okButton = page.getByText('OK', { exact: true }).first();
  if (await okButton.isVisible().catch(() => false)) {
    await okButton.click();
  }
  await page.waitForTimeout(300);
}

/**
 * Opens the notification bell and waits for the modal.
 */
async function openNotificationBell(page: Page) {
  // React Native Web renders the MaterialIcons bell as a span with text "notifications".
  // Click its nearest clickable ancestor.
  await page.evaluate(() => {
    const icon = Array.from(document.querySelectorAll('span')).find(
      (s) => s.textContent?.trim() === 'notifications'
    );
    if (!icon) throw new Error('Notifications bell icon not found');
    let clickable: Element | null = icon.parentElement;
    while (clickable && clickable !== document.body) {
      const style = window.getComputedStyle(clickable);
      if (style.cursor === 'pointer' || clickable.getAttribute('role') === 'button') {
        (clickable as HTMLElement).click();
        return;
      }
      clickable = clickable.parentElement;
    }
    (icon.parentElement as HTMLElement)?.click();
  });
  await page.waitForTimeout(300);
  await expect(page.getByText('Notifications', { exact: true }).first()).toBeVisible({
    timeout: 10000,
  });
}

interface TestCredentials {
  email: string;
  password: string;
  fullName: string;
  userId?: string;
}

/**
 * Returns the credentials to use. Prefers the global disposable user if it was
 * admin-created; otherwise falls back to the existing test account.
 */
function getTestCredentials(): TestCredentials {
  const globalCreds = getGlobalTestUser();
  if (globalCreds?.adminCreated && globalCreds.userId) {
    return globalCreds;
  }
  return {
    email: process.env.PW_E2E_USERNAME || 'mohamed@owdsolutions.co.za',
    password: process.env.PW_E2E_PASSWORD || 'Thierry14247!',
    fullName: process.env.PW_E2E_USERNAME || 'Test User',
  };
}

/**
 * Finds the first vendor owned by the authenticated user.
 */
async function findVendorForUser(
  client: SupabaseClient<any, any, any>,
  userId: string
): Promise<{ id: number; name: string } | null> {
  const { data, error } = await client
    .from('vendors')
    .select('id, name')
    .eq('user_id', userId)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[findVendorForUser] error:', error.message);
    return null;
  }
  if (!data) return null;
  return { id: data.id, name: data.name };
}

/**
 * Cancels and deletes a quote request created by the test user.
 */
async function cleanupQuoteRequest(
  client: SupabaseClient<any, any, any>,
  vendorId: number,
  email: string
) {
  const { data: rows } = await client
    .from('quote_requests')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!rows || rows.length === 0) return;

  const id = rows[0].id;
  await client.from('quote_requests').update({ status: 'cancelled' }).eq('id', id);
  await client.from('quote_requests').delete().eq('id', id).eq('status', 'cancelled');
}

/**
 * Marks quote-request notifications for the authenticated user as read.
 */
async function markNotificationsRead(client: SupabaseClient<any, any, any>, userId: string) {
  await client
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('type', 'quote_requested')
    .eq('read', false);
}

test.describe('Phase 4 — Quote Request Flow (Self-Quote)', () => {
  let credentials: TestCredentials;
  let authedClient: SupabaseClient<any, any, any>;
  let authedUser: User;
  let vendor: { id: number; name: string } | null = null;

  test.beforeAll(async () => {
    credentials = getTestCredentials();
    const authResult = await createAuthedSupabaseClient(credentials.email, credentials.password);
    authedClient = authResult.client;
    authedUser = authResult.user;
    credentials.userId = authedUser.id;

    vendor = await findVendorForUser(authedClient, authedUser.id);
    if (!vendor) {
      console.warn(
        `[Phase 4] No vendor found for ${credentials.email}. Use the Supabase MCP to create one, or set SUPABASE_SERVICE_ROLE_KEY so the test can create it. Skipping self-quote test.`
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    await gotoApp(page, '/auth');
    const globalCreds = getGlobalTestUser();
    if (globalCreds?.adminCreated) {
      await loginAsGlobalTestUser(page);
    } else {
      await loginFromWelcome(page);
    }
    await acceptPopiaConsent(page);
  });

  test.afterAll(async () => {
    if (authedClient && vendor && credentials?.email) {
      await cleanupQuoteRequest(authedClient, vendor.id, credentials.email);
    }
    if (authedClient && authedUser) {
      await markNotificationsRead(authedClient, authedUser.id);
    }
  });

  test('self-quote: request, notify, and list', async ({ page }) => {
    test.skip(!vendor, 'No vendor owned by the test user; create one via Supabase MCP or service-role key.');

    const quoteDetails = 'Self-quote test details - please respond.';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    // ── 1. Open the self-owned vendor profile from Discover ──
    await navigateToDiscover(page);
    await searchAndOpenListing(page, vendor.name);

    // Profile name text is often clipped/hidden in RN Web, so just assert it exists
    // and that the profile-specific "Request Quote" action is present.
    await expect(page.getByText(vendor.name)).toHaveCount(1);
    await expect(page.getByText('Request Quote', { exact: true }).first()).toBeVisible({
      timeout: 10000,
    });

    // ── 2. Click Request Quote ──
    const requestQuoteClicked = await page.evaluate(() => {
      function isVisibleElement(el: Element): boolean {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0'
        );
      }
      const all = Array.from(document.querySelectorAll('div, span, button, a'));
      const match = all.find((d) => d.textContent?.trim() === 'Request Quote');
      if (!match) return false;
      let clickable: Element | null = match.parentElement;
      while (clickable) {
        if (isVisibleElement(clickable)) {
          const style = window.getComputedStyle(clickable);
          if (style.cursor === 'pointer' || clickable.getAttribute('role') === 'button' || clickable.tagName === 'BUTTON') {
            (clickable as HTMLElement).click();
            return true;
          }
        }
        clickable = clickable.parentElement;
      }
      return false;
    });
    if (!requestQuoteClicked) {
      throw new Error('Could not click Request Quote button');
    }
    await page.waitForTimeout(400);
    await expect(page.getByText('Your details').first()).toBeVisible({ timeout: 10000 });

    // ── 3. Fill the quote form ──
    // The form is pre-filled with the logged-in user's name/email; overwrite them
    // with deterministic values so the backend assertions are reliable.
    await page.getByPlaceholder('e.g. Thandi M').first().fill('E2E Self-Quote');
    await page.getByPlaceholder('you@example.com').first().fill(credentials.email);
    await page.getByPlaceholder('e.g. 082 123 4567').first().fill('0821234567');
    await pickEventDate(page, dateString);
    await page.getByPlaceholder('Any other details the lister should know...').first().fill(quoteDetails);

    // ── 4. Submit and assert success ──
    const submitBtn = page.getByRole('button', { name: /Submit quote request/i }).first();
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();
    await dismissQuoteSuccessAlert(page);

    // ── 5. Backend assertions ──
    const { data: quoteRows, error: quoteError } = await authedClient
      .from('quote_requests')
      .select('id, name, email, contact_phone, details, event_date, vendor_id, user_id, status')
      .eq('vendor_id', vendor.id)
      .eq('email', credentials.email)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(quoteError).toBeNull();
    expect(quoteRows?.length, 'quote_requests row should exist for the self-quote').toBe(1);
    const quote = quoteRows![0];
    expect(quote.status).toBe('pending');
    expect(quote.details).toContain('Self-quote test details');

    const { data: notifications, error: notifError } = await authedClient
      .from('notifications')
      .select('id, type, title, body, link, read')
      .eq('user_id', credentials.userId)
      .eq('type', 'quote_requested')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(notifError).toBeNull();
    expect(notifications?.length, 'notification should be created for the listing owner').toBe(1);
    expect(notifications![0].title).toBe('New quote request');
    expect(notifications![0].read).toBe(false);

    // ── 6. In-app notification bell ──
    await openNotificationBell(page);
    await expect(page.getByText('New quote request').first()).toBeVisible({ timeout: 10000 });

    // Click the notification and assert the modal closes (deep link for vendor quotes
    // navigates to the Account > quote requests area; the modal should at least close).
    await page.getByText('New quote request').first().click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Notifications', { exact: true }).first()).not.toBeVisible();

    // ── 7. Quotes tab lists the new request ──
    await clickBottomTab(page, 'Quotes');
    await expect(page.getByText(vendor.name).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('pending', { exact: false }).first()).toBeVisible({ timeout: 10000 });

    // Open the quote detail and assert it renders
    await page.getByText('View Details', { exact: true }).first().click();
    await page.waitForTimeout(500);
    await expect(page.getByText(vendor.name).first()).toBeVisible({ timeout: 10000 });
  });
});
