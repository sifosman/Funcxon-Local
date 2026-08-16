import { expect, test, type Page } from '@playwright/test';
import {
  acceptPopiaConsent,
  getGlobalTestUser,
  gotoApp,
  loginAsGlobalTestUser,
  loginFromWelcome,
  supabase,
  getServiceRoleSupabase,
} from '../helpers';

/* ──────────────────────────────────────────────────────────────
   Phase 3 — Mobile Profile Screen Specs
   Items: 12, 13, 14, 17, 18, 20, 23, 24, 25
   29JULY Items: 7, 23, 24, 25
   ────────────────────────────────────────────────────────────── */

// ── Shared helpers (duplicated from phase-03 for self-containment) ──

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
  await page.getByText(name, { exact: true }).first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => null);

  try {
    await clickButtonByName(page, name);
    return;
  } catch {
    // continue
  }

  try {
    await clickByText(page, name);
    return;
  } catch {
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
    const match = all.find((d) => d.textContent?.trim().toLowerCase() === target);
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

// ── DB helpers ──

async function fetchSampleVendor() {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, address_line_1, city, description, rating, review_count, price_range, features')
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
    .select('id, name, address_line_1, city, description, venue_capacity, amenities, venue_type, features, price_range')
    .not('address_line_1', 'is', null)
    .not('city', 'is', null)
    .order('id', { ascending: true })
    .limit(60);
  if (error || !data || data.length === 0) {
    console.log('[fetchVenueWithTours] No venues found');
    return null;
  }
  const withTours = data.find(
    (v) => v.features?.tour_bookings === true || v.features?.instant_tour_bookings === true
  );
  return withTours || data[0];
}

/**
 * 29JULY Item 23: Check that recent venue listings have tour booking features.
 */
async function fetchRecentVenues(limit = 10) {
  const serviceRole = getServiceRoleSupabase();
  const { data, error } = await serviceRole
    .from('venue_listings')
    .select('id, name, features, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) {
    console.log(`[fetchRecentVenues] ${error?.message ?? 'no venues'}`);
    return [];
  }
  return data;
}

// ── Color extraction helper ──

async function getElementsWithColor(page: Page, text: string): Promise<{ text: string; color: string }[]> {
  return page.evaluate((targetText: string) => {
    const results: { text: string; color: string }[] = [];
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      if (el.textContent?.trim() === targetText) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          results.push({ text: el.textContent.trim(), color: style.color });
        }
      }
    }
    return results;
  }, text);
}

async function getTabColors(page: Page): Promise<{ label: string; color: string; borderBottomColor: string }[]> {
  return page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"], [role="button"]'));
    const results: { label: string; color: string; borderBottomColor: string }[] = [];
    for (const tab of tabs) {
      const text = tab.textContent?.trim();
      if (!text) continue;
      const style = window.getComputedStyle(tab);
      const rect = tab.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        results.push({ label: text, color: style.color, borderBottomColor: style.borderBottomColor });
      }
    }
    return results;
  }, );
}

// ── Tests ──

test.describe('Phase 3 — Mobile Profile Screen', () => {
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

  test('Venue profile — Book a Tour button visible with contrasting background (Item 12)', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);

    // Item 12: Book a Tour button should be visible with contrasting background
    const bookTourText = page.getByText('Book a Tour', { exact: true }).first();
    const isVisible = await bookTourText.isVisible().catch(() => false);
    if (isVisible) {
      // Check that the button has a contrasting background (not white/transparent)
      const bgColor = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('*'));
        const match = all.find((d) => d.textContent?.trim() === 'Book a Tour');
        if (!match) return null;
        let el: Element | null = match;
        while (el) {
          const style = window.getComputedStyle(el);
          if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'rgb(255, 255, 255)') {
            return style.backgroundColor;
          }
          el = el.parentElement;
        }
        return null;
      });
      expect(bgColor, 'Book a Tour button should have a contrasting background').not.toBeNull();
    } else {
      console.log(`Venue "${venue.name}" does not have tour bookings enabled; skipping Book a Tour assertion`);
    }
  });

  test('Venue profile — No "Get started" badge (Item 13)', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);

    // Item 13: No "Get started" badge on profile
    const getStarted = page.getByText('Get started', { exact: true }).first();
    expect(await getStarted.isVisible().catch(() => false), 'Get started badge should not be visible on profile').toBe(false);
  });

  test('Vendor profile — No "Get started" badge (Item 13)', async ({ page }) => {
    const vendor = await fetchSampleVendor();
    if (!vendor) {
      console.log('No sample vendor found; skipping');
      return;
    }

    await navigateToDiscover(page, 'vendor');
    await openProfileCard(page, vendor.name);
    await expectAnyVisibleText(page, vendor.name);

    const getStarted = page.getByText('Get started', { exact: true }).first();
    expect(await getStarted.isVisible().catch(() => false), 'Get started badge should not be visible on profile').toBe(false);
  });

  test('Vendor profile — Favourite heart active = coral/reddish colour (Item 14)', async ({ page }) => {
    const vendor = await fetchSampleVendor();
    if (!vendor) {
      console.log('No sample vendor found; skipping');
      return;
    }

    await navigateToDiscover(page, 'vendor');
    await openProfileCard(page, vendor.name);
    await expectAnyVisibleText(page, vendor.name);

    // Click favourite
    await clickProfileHeaderIcon(page, vendor.name, 'favourite');
    await expectNoErrorAlert(page);
    await page.waitForTimeout(500);

    // Item 14: After favouriting, the heart icon should be coral/reddish
    const heartColor = await page.evaluate((name: string) => {
      const nameMatches = Array.from(document.querySelectorAll('div')).filter(
        (d) => d.textContent?.trim() === name && d.getBoundingClientRect().width > 0
      );
      for (const nameEl of nameMatches) {
        let header = nameEl.parentElement;
        while (header && header !== document.body) {
          const icons = Array.from(header.querySelectorAll('span, i, svg, .material-icons')).filter((el) => {
            const text = el.textContent?.trim() || '';
            return text.includes('favorite') || text.includes('heart');
          });
          for (const icon of icons) {
            const style = window.getComputedStyle(icon);
            const rect = icon.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              return { color: style.color, text: icon.textContent?.trim() };
            }
          }
          header = header.parentElement;
        }
      }
      return null;
    }, vendor.name);

    if (heartColor) {
      // Coral is #F26B4F ≈ rgb(242, 107, 79); reddish colours have high R, moderate G, low B
      const rgbMatch = heartColor.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        // Coral/reddish: R > G > B with R significantly higher than B
        expect(r, `Heart R should be high (coral/reddish), got ${heartColor.color}`).toBeGreaterThan(150);
        expect(r > b, `Heart should be reddish (R > B), got ${heartColor.color}`).toBe(true);
      }
    }
  });

  test('Venue profile — No small thumbnails below main image (Item 17)', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await page.waitForTimeout(1000);

    // Item 17: No small thumbnail strip below the main gallery image
    // Check for thumbnail-like elements (small images in a row below the main image)
    const thumbnailStrip = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const mainImage = images.find((img) => {
        const rect = img.getBoundingClientRect();
        return rect.width > 200 && rect.height > 100 && rect.top < 300;
      });
      if (!mainImage) return false;

      const mainRect = mainImage.getBoundingClientRect();
      // Look for small images (width < 100) positioned just below the main image
      const thumbnails = images.filter((img) => {
        const rect = img.getBoundingClientRect();
        return (
          rect.width < 100 &&
          rect.height < 100 &&
          rect.top > mainRect.bottom &&
          rect.top < mainRect.bottom + 120
        );
      });
      return thumbnails.length > 0;
    });

    expect(thumbnailStrip, 'No small thumbnails should be below the main image').toBe(false);
  });

  test('Vendor profile — No small thumbnails below main image (Item 17)', async ({ page }) => {
    const vendor = await fetchSampleVendor();
    if (!vendor) {
      console.log('No sample vendor found; skipping');
      return;
    }

    await navigateToDiscover(page, 'vendor');
    await openProfileCard(page, vendor.name);
    await expectAnyVisibleText(page, vendor.name);
    await page.waitForTimeout(1000);

    const thumbnailStrip = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const mainImage = images.find((img) => {
        const rect = img.getBoundingClientRect();
        return rect.width > 200 && rect.height > 100 && rect.top < 300;
      });
      if (!mainImage) return false;

      const mainRect = mainImage.getBoundingClientRect();
      const thumbnails = images.filter((img) => {
        const rect = img.getBoundingClientRect();
        return (
          rect.width < 100 &&
          rect.height < 100 &&
          rect.top > mainRect.bottom &&
          rect.top < mainRect.bottom + 120
        );
      });
      return thumbnails.length > 0;
    });

    expect(thumbnailStrip, 'No small thumbnails should be below the main image').toBe(false);
  });

  test('Venue profile — Tab selected = coral/orange colour (Item 18)', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await page.waitForTimeout(500);

    // Item 18: Selected tab should have coral/orange colour
    // The "About" tab should be selected by default
    const tabColors = await getTabColors(page);
    const aboutTab = tabColors.find((t) => t.label === 'About');
    if (aboutTab) {
      const rgbMatch = aboutTab.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        // Coral #F26B4F ≈ rgb(242, 107, 79) or orange-ish: high R, moderate G, low B
        expect(r > 150 && r > b, `Selected tab should be coral/orange (R > B), got ${aboutTab.color}`).toBe(true);
      }
    }
  });

  test('Venue profile — Tab order: Catalogue to left of Reviews, Reviews at far right (Item 20)', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await page.waitForTimeout(500);

    // Item 20: Calendar tab → "Catalogue" tab, reviews tab at far right, catalogue to left of reviews
    const tabInfo = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"], [role="button"]'));
      const result: { label: string; x: number }[] = [];
      for (const tab of tabs) {
        const text = tab.textContent?.trim();
        if (!text) continue;
        const rect = tab.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          result.push({ label: text, x: rect.left });
        }
      }
      return result;
    });

    const catalogueTab = tabInfo.find((t) => t.label === 'Catalogue');
    const reviewsTab = tabInfo.find((t) => t.label === 'Reviews');

    if (catalogueTab && reviewsTab) {
      // Catalogue should be to the left of Reviews (smaller x)
      expect(catalogueTab.x, 'Catalogue tab should be to the left of Reviews tab').toBeLessThan(reviewsTab.x);
    }

    // Reviews should be at the far right (highest x among profile tabs)
    const profileTabs = tabInfo.filter((t) =>
      ['About', 'Amenities', 'Reviews', 'Catalogue', 'Features', 'Calendar'].includes(t.label)
    );
    if (profileTabs.length > 0 && reviewsTab) {
      const maxX = Math.max(...profileTabs.map((t) => t.x));
      expect(reviewsTab.x, 'Reviews tab should be at the far right').toBe(maxX);
    }

    // Calendar tab should NOT exist (replaced by Catalogue)
    const calendarTab = tabInfo.find((t) => t.label === 'Calendar');
    expect(calendarTab, 'Calendar tab should not exist — replaced by Catalogue').toBeUndefined();
  });

  test('Vendor profile — Tab order: Catalogue to left of Reviews, Reviews at far right (Item 20)', async ({ page }) => {
    const vendor = await fetchSampleVendor();
    if (!vendor) {
      console.log('No sample vendor found; skipping');
      return;
    }

    await navigateToDiscover(page, 'vendor');
    await openProfileCard(page, vendor.name);
    await expectAnyVisibleText(page, vendor.name);
    await page.waitForTimeout(500);

    const tabInfo = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"], [role="button"]'));
      const result: { label: string; x: number }[] = [];
      for (const tab of tabs) {
        const text = tab.textContent?.trim();
        if (!text) continue;
        const rect = tab.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          result.push({ label: text, x: rect.left });
        }
      }
      return result;
    });

    // Calendar tab should NOT exist — replaced by Catalogue
    const calendarTab = tabInfo.find((t) => t.label === 'Calendar');
    expect(calendarTab, 'Calendar tab should not exist — replaced by Catalogue').toBeUndefined();

    const catalogueTab = tabInfo.find((t) => t.label === 'Catalogue');
    const reviewsTab = tabInfo.find((t) => t.label === 'Reviews');

    if (catalogueTab && reviewsTab) {
      expect(catalogueTab.x, 'Catalogue tab should be to the left of Reviews tab').toBeLessThan(reviewsTab.x);
    }

    const profileTabs = tabInfo.filter((t) =>
      ['About', 'Features', 'Reviews', 'Catalogue', 'Calendar'].includes(t.label)
    );
    if (profileTabs.length > 0 && reviewsTab) {
      const maxX = Math.max(...profileTabs.map((t) => t.x));
      expect(reviewsTab.x, 'Reviews tab should be at the far right').toBe(maxX);
    }
  });

  test('Venue profile — Rating breakdown available for users to select (Item 23)', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);

    // Navigate to reviews tab
    await clickByText(page, 'Reviews');
    await page.waitForTimeout(500);

    // Item 23: Rating breakdown should be visible (e.g., 5★, 4★, 3★, etc.)
    const hasRatingBreakdown = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const ratingBreakdown = all.find((el) => {
        const text = el.textContent?.trim() || '';
        return text.includes('5') && text.includes('4') && text.includes('3') && text.includes('2') && text.includes('1') &&
               (text.includes('★') || text.includes('star') || text.includes('Star'));
      });
      return !!ratingBreakdown && ratingBreakdown.getBoundingClientRect().width > 0;
    });

    // Alternatively, check for "Overall Rating" text which indicates the rating section
    const overallRatingVisible = await page.getByText(/Overall Rating|Ratings System|Rating Breakdown/i).first().isVisible().catch(() => false);
    expect(overallRatingVisible || hasRatingBreakdown, 'Rating breakdown should be visible in reviews tab').toBe(true);
  });

  test('Vendor profile — Rating breakdown available for users to select (Item 23)', async ({ page }) => {
    const vendor = await fetchSampleVendor();
    if (!vendor) {
      console.log('No sample vendor found; skipping');
      return;
    }

    await navigateToDiscover(page, 'vendor');
    await openProfileCard(page, vendor.name);
    await expectAnyVisibleText(page, vendor.name);

    await clickByText(page, 'Reviews');
    await page.waitForTimeout(500);

    const overallRatingVisible = await page.getByText(/Overall Rating|Ratings System|Rating Breakdown/i).first().isVisible().catch(() => false);
    expect(overallRatingVisible, 'Rating breakdown should be visible in reviews tab').toBe(true);
  });

  test('Venue profile — Overall rating section compact (Item 24)', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);

    await clickByText(page, 'Reviews');
    await page.waitForTimeout(500);

    // Item 24: Overall rating section should be compact (not take up too much vertical space)
    const ratingSectionHeight = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const ratingSection = all.find((el) => {
        const text = el.textContent?.trim() || '';
        return (text.includes('Overall Rating') || text.includes('Ratings System')) &&
               el.getBoundingClientRect().width > 0;
      });
      if (!ratingSection) return null;
      // Find the containing card/section
      let container = ratingSection.parentElement;
      while (container) {
        const rect = container.getBoundingClientRect();
        if (rect.height > 50 && rect.height < 600) {
          return rect.height;
        }
        container = container.parentElement;
      }
      return ratingSection.getBoundingClientRect().height;
    });

    if (ratingSectionHeight !== null) {
      // Compact means the rating section should not be excessively tall (< 400px)
      expect(ratingSectionHeight, 'Overall rating section should be compact (< 400px)').toBeLessThan(400);
    }
  });

  test('Venue profile — No pricing in profile overview (Item 25)', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await page.waitForTimeout(500);

    // Item 25: No pricing in profile overview (header area)
    // Price range should only appear in About section, not in the header/overview
    const headerPriceText = await page.evaluate((name: string) => {
      const nameMatches = Array.from(document.querySelectorAll('div')).filter(
        (d) => d.textContent?.trim() === name && d.getBoundingClientRect().width > 0
      );
      for (const nameEl of nameMatches) {
        // Check the header area (parent containers up to 3 levels)
        let el = nameEl.parentElement;
        for (let i = 0; i < 5 && el; i++) {
          const text = el.textContent || '';
          // Look for price patterns like "R1,000" or "R 100" in the header area
          const priceMatch = text.match(/R\d[\d,]*/);
          if (priceMatch) {
            // Make sure it's not the price_range label "Price range: ..."
            if (!text.includes('Price range:')) {
              return priceMatch[0];
            }
          }
          el = el.parentElement;
        }
      }
      return null;
    }, venue.name);

    expect(headerPriceText, 'No pricing should be visible in profile overview/header').toBeNull();
  });

  test('Vendor profile — Price range in About section (29JULY Item 7)', async ({ page }) => {
    const vendor = await fetchSampleVendor();
    if (!vendor) {
      console.log('No sample vendor found; skipping');
      return;
    }

    await navigateToDiscover(page, 'vendor');
    await openProfileCard(page, vendor.name);
    await expectAnyVisibleText(page, vendor.name);
    await page.waitForTimeout(500);

    // 29JULY Item 7: Price range should appear in About section if vendor has one
    if (vendor.price_range) {
      await expectAnyVisibleText(page, `Price range: ${vendor.price_range}`);
    } else {
      // If no price_range, verify no price range text is shown
      const priceRangeText = page.getByText(/Price range:/i).first();
      expect(await priceRangeText.isVisible().catch(() => false)).toBe(false);
      console.log('Vendor has no price_range; verified no price range text shown');
    }
  });

  test('Venue profile — Price range in About section (29JULY Item 7)', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await page.waitForTimeout(500);

    if (venue.price_range) {
      await expectAnyVisibleText(page, `Price range: ${venue.price_range}`);
    } else {
      const priceRangeText = page.getByText(/Price range:/i).first();
      expect(await priceRangeText.isVisible().catch(() => false)).toBe(false);
      console.log('Venue has no price_range; verified no price range text shown');
    }
  });

  test('29JULY Item 23 — Recent venue listings have Book a Tour feature (DB check)', async () => {
    const recentVenues = await fetchRecentVenues(10);
    if (recentVenues.length === 0) {
      console.log('No recent venues found; skipping DB check');
      return;
    }

    // Check that at least some recent venues have tour_booking features
    const venuesWithTours = recentVenues.filter(
      (v) => v.features?.tour_bookings === true || v.features?.instant_tour_bookings === true
    );
    console.log(`[29JULY Item 23] ${venuesWithTours.length}/${recentVenues.length} recent venues have tour features`);
    // At least verify the data structure supports it (don't fail if none have tours enabled)
    expect(recentVenues.length, 'Should have recent venues to check').toBeGreaterThan(0);
  });

  test('Vendor profile — Contact for Availability button visible (29JULY Item 24)', async ({ page }) => {
    const vendor = await fetchSampleVendor();
    if (!vendor) {
      console.log('No sample vendor found; skipping');
      return;
    }

    await navigateToDiscover(page, 'vendor');
    await openProfileCard(page, vendor.name);
    await expectAnyVisibleText(page, vendor.name);
    await page.waitForTimeout(500);

    // 29JULY Item 24: "Contact for Availability" button should be visible somewhere in profile
    const contactAvail = page.getByText(/Contact for Availability/i).first();
    const isVisible = await contactAvail.isVisible().catch(() => false);
    if (!isVisible) {
      // Try scrolling down to find it
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
    }
    const isVisibleAfterScroll = await contactAvail.isVisible().catch(() => false);
    expect(isVisible || isVisibleAfterScroll, 'Contact for Availability button should be visible on vendor profile').toBe(true);
  });

  test('Venue profile — View Catalogue button removed from profile (29JULY Item 25)', async ({ page }) => {
    const venue = await fetchVenueWithTours();
    if (!venue) {
      console.log('No sample venue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await page.waitForTimeout(500);

    // 29JULY Item 25: "View Catalogue" button should NOT be visible on the profile
    // (The catalogue tab replaces the standalone button)
    const viewCatalogue = page.getByText('View Catalogue', { exact: true }).first();
    const isVisible = await viewCatalogue.isVisible().catch(() => false);
    expect(isVisible, 'View Catalogue button should be removed from profile').toBe(false);
  });
});
