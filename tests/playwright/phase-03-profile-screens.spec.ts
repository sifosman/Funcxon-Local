import { expect, test, type Page } from '@playwright/test';
import {
  acceptPopiaConsent,
  getGlobalTestUser,
  gotoApp,
  loginAsGlobalTestUser,
  loginFromWelcome,
  supabase,
} from './helpers';

async function navigateToDiscover(page: Page, type: 'vendor' | 'venue') {
  const label = type === 'venue' ? 'Venues' : 'Vendors';
  const button = page.getByText(label, { exact: true }).first();
  if (await button.isVisible().catch(() => false)) {
    await button.click({ force: true });
  } else {
    await gotoApp(page, '/');
    await page.getByText(label, { exact: true }).first().click({ force: true });
  }
  await page.waitForTimeout(300);
}

async function openProfileCard(page: Page, name: string) {
  // Wait for the listing to render in the results grid before interacting.
  await page.getByText(name, { exact: true }).first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => null);

  try {
    await clickButtonByName(page, name);
    return;
  } catch (e) {
    // continue
  }

  try {
    await clickByText(page, name);
    return;
  } catch (e) {
    // continue
  }

  const searchInput = page
    .locator(
      'input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="Quick search"], input[placeholder*="venues, vendors"], input[placeholder*="services"]'
    )
    .first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill(name);
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
  }
  await clickByText(page, name);
}

async function expectAnyVisibleText(page: Page, text: string) {
  const start = Date.now();
  while (Date.now() - start < 6000) {
    const locators = await page.getByText(text).all();
    for (const locator of locators) {
      if (await locator.isVisible().catch(() => false)) return;
    }
    await page.waitForTimeout(100);
  }
  throw new Error(`No visible element with text "${text}" found`);
}

async function clickByText(page: Page, text: string) {
  const locators = await page.getByText(text, { exact: true }).all();
  for (const locator of locators) {
    if (await locator.isVisible().catch(() => false)) {
      await locator.click({ force: true });
      await page.waitForTimeout(100);
      return;
    }
  }

  // Fallback: search for the text anywhere in the page and dispatch a click on the nearest visible clickable ancestor.
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
    const all = Array.from(document.querySelectorAll('div, span, button, a'));
    const match = all.find(
      (d) => d.textContent?.trim().toLowerCase() === target
    );
    if (!match) return false;
    let clickable = match.parentElement;
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
    (match as HTMLElement).click();
    return true;
  }, text);
  if (!clicked) throw new Error(`Could not click element with text "${text}"`);
  await page.waitForTimeout(200);
}

async function clickButtonByName(page: Page, name: string | RegExp) {
  const buttons = await page.getByRole('button', { name }).all();
  for (const btn of buttons) {
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true });
      await page.waitForTimeout(100);
      return;
    }
  }
  throw new Error(`No visible button with name "${name}" found`);
}

async function clickBack(page: Page) {
  const back = page.getByText('Back', { exact: true }).first();
  if (await back.isVisible().catch(() => false)) {
    await back.click({ force: true });
    await page.waitForTimeout(200);
    return;
  }
  // Fallback: click the header back arrow icon (small pointer element in the top-left, below the top nav).
  const clicked = await page.evaluate(() => {
    function isVisibleElement(el: Element): boolean {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }
    function isInsideDialog(el: Element | null): boolean {
      while (el) {
        if (el.getAttribute('role') === 'dialog' || el.tagName === 'DIALOG') return true;
        el = el.parentElement;
      }
      return false;
    }
    const all = Array.from(document.querySelectorAll('div, span, button, a, i, svg'));
    const candidates = all.filter((el) => {
      if (!isVisibleElement(el)) return false;
      const style = window.getComputedStyle(el);
      if (style.cursor !== 'pointer') return false;
      if (isInsideDialog(el)) return false;
      const rect = el.getBoundingClientRect();
      if (rect.top < 60 || rect.top > 200) return false;
      if (rect.left > 220) return false;
      if (rect.width > 80 || rect.height > 80) return false;
      return true;
    });
    if (candidates.length === 0) return false;
    candidates.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    (candidates[0] as HTMLElement).click();
    return true;
  });
  if (clicked) {
    await page.waitForTimeout(300);
    return;
  }
  await page.goBack();
  await page.waitForTimeout(200);
}

async function goBackToProfile(page: Page, profileName: string, type: 'vendor' | 'venue') {
  // The app has no visible back button and the URL doesn't change, so return via Discover.
  await navigateToDiscover(page, type);
  await openProfileCard(page, profileName);
}

async function clickProfileHeaderIcon(page: Page, targetName: string, action: 'favourite' | 'share') {
  const index = action === 'favourite' ? 0 : 1;
  const clicked = await page.evaluate(
    ({ name, idx }: { name: string; idx: number }) => {
      const nameMatches = Array.from(document.querySelectorAll('div')).filter(
        (d) => d.textContent?.trim() === name && d.getBoundingClientRect().width > 0
      );
      for (const nameEl of nameMatches) {
        let header = nameEl.parentElement;
        while (header && header !== document.body) {
          const buttons = Array.from(header.querySelectorAll('div')).filter((d) => {
            const style = window.getComputedStyle(d);
            const rect = d.getBoundingClientRect();
            const radius = parseFloat(style.borderRadius);
            return (
              style.cursor === 'pointer' &&
              rect.width >= 30 &&
              rect.width <= 45 &&
              rect.height >= 30 &&
              rect.height <= 45 &&
              radius >= 10
            );
          });
          if (buttons.length >= 2) {
            (buttons[idx] as HTMLElement).click();
            return true;
          }
          header = header.parentElement;
        }
      }
      return false;
    },
    { name: targetName, idx: index }
  );
  if (!clicked) throw new Error(`Could not find ${action} icon button for "${targetName}"`);
  await page.waitForTimeout(100);
}

async function expectNoErrorAlert(page: Page) {
  const badTitles = ['Favourite update failed', 'Sign in required'];
  for (const title of badTitles) {
    const el = page.getByText(title, { exact: true }).first();
    expect(await el.isVisible().catch(() => false), `Unexpected alert: ${title}`).toBe(false);
  }
}

async function fetchSampleVendor() {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, address_line_1, city, description, rating, review_count')
    .not('address_line_1', 'is', null)
    .not('city', 'is', null)
    .order('id', { ascending: true })
    .limit(60);
  if (error || !data || data.length === 0) {
    console.log(`[fetchSampleVendor] ${error?.message ?? 'no vendors found'}`);
    return null;
  }
  return data[0];
}

async function fetchVenueWithTours() {
  const { data, error } = await supabase
    .from('venue_listings')
    .select('id, name, address_line_1, city, description, venue_capacity, amenities, venue_type, features')
    .not('address_line_1', 'is', null)
    .not('city', 'is', null)
    .order('id', { ascending: true })
    .limit(60);
  if (error || !data || data.length === 0) {
    console.log('[fetchVenueWithTours] No venues found; falling back to any venue');
    const { data: fallback } = await supabase
      .from('venue_listings')
      .select('id, name, address_line_1, city, description, venue_capacity, amenities, venue_type, features')
      .not('address_line_1', 'is', null)
      .not('city', 'is', null)
      .order('id', { ascending: true })
      .limit(1)
      .single();
    return fallback;
  }
  const withTours = data.find(
    (v) => v.features?.tour_bookings === true || v.features?.instant_tour_bookings === true
  );
  return withTours || data[0];
}

test.describe('Phase 3 — Vendor & Venue Profile Screens', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page, '/auth');
    await page.waitForTimeout(1500);
    const globalCreds = getGlobalTestUser();
    if (globalCreds?.adminCreated) {
      await loginAsGlobalTestUser(page);
    } else {
      await loginFromWelcome(page);
    }
    await acceptPopiaConsent(page);
  });

  test('Vendor profile - header, request quote, favourite, share, reviews, back', async ({ page }) => {
    const vendor = await fetchSampleVendor();
    if (!vendor) {
      console.log('No sample vendor found; skipping vendor profile test');
      return;
    }

    await navigateToDiscover(page, 'vendor');
    await openProfileCard(page, vendor.name);
    await expectAnyVisibleText(page, vendor.name);
    await expectAnyVisibleText(page, vendor.city);
    if (vendor.description) {
      await expectAnyVisibleText(page, vendor.description.slice(0, 80));
    }

    // Request Quote
    await clickByText(page, 'Request Quote');
    await expectAnyVisibleText(page, 'Your details');
    await goBackToProfile(page, vendor.name, 'vendor');

    // Favourite toggle
    await clickProfileHeaderIcon(page, vendor.name, 'favourite');
    await expectNoErrorAlert(page);
    await page.waitForTimeout(300);

    // Share
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 3000 }).catch(() => null),
      clickProfileHeaderIcon(page, vendor.name, 'share'),
    ]);
    if (popup) await popup.close();

    // Reviews tab + leave a review
    await clickByText(page, 'Reviews');
    await expectAnyVisibleText(page, 'Overall Rating');
    await clickButtonByName(page, 'Leave a review');
    await expectAnyVisibleText(page, 'Your rating');

    // Back
    await navigateToDiscover(page, 'vendor');
    await expectAnyVisibleText(page, 'Filters');
  });

  test('Venue profile - header, book tour, request quote, catalogue, favourite, share, reviews, back', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping venue profile test');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await expectAnyVisibleText(page, venue.city);
    if (venue.description) {
      await expectAnyVisibleText(page, venue.description.slice(0, 80));
    }

    // Book a Tour (if the venue has tour bookings enabled)
    const bookTourVisible = await page.getByText('Book a Tour', { exact: true }).first().isVisible().catch(() => false);
    if (bookTourVisible) {
      await clickByText(page, 'Book a Tour');
      await expectAnyVisibleText(page, 'Book a tour at');
      await goBackToProfile(page, venue.name, 'venue');
    } else {
      console.log(`Venue "${venue.name}" does not have tour bookings enabled; skipping Book a Tour assertion`);
    }

    // Request Quote
    await clickByText(page, 'Request Quote');
    await expectAnyVisibleText(page, 'Your details');
    await goBackToProfile(page, venue.name, 'venue');

    // View Catalogue
    await clickByText(page, 'View Catalogue');
    await expectAnyVisibleText(page, venue.name);
    await expectAnyVisibleText(page, 'Catalogue');
    await goBackToProfile(page, venue.name, 'venue');

    // Favourite toggle
    await clickProfileHeaderIcon(page, venue.name, 'favourite');
    await expectNoErrorAlert(page);
    await page.waitForTimeout(300);

    // Share
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 3000 }).catch(() => null),
      clickProfileHeaderIcon(page, venue.name, 'share'),
    ]);
    if (popup) await popup.close();

    // Reviews tab + add a review
    await clickByText(page, 'View Reviews & Ratings');
    await expectAnyVisibleText(page, 'Ratings System');
    const addReviewVisible = await page.getByText('Add a review', { exact: true }).first().isVisible().catch(() => false);
    if (addReviewVisible) {
      await clickByText(page, 'Add a review');
    } else {
      await clickByText(page, 'Leave a review');
    }
    await expectAnyVisibleText(page, 'Your rating');

    // Back
    await navigateToDiscover(page, 'venue');
    await expectAnyVisibleText(page, 'Filters');
  });
});
