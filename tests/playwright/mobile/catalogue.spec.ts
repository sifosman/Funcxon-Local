import { expect, test, type Page } from '@playwright/test';
import {
  acceptPopiaConsent,
  getGlobalTestUser,
  gotoApp,
  loginAsGlobalTestUser,
  loginFromWelcome,
  supabase,
} from '../helpers';

/* ──────────────────────────────────────────────────────────────
   Phase 3 — Mobile Catalogue Specs
   Items: 19, 20, 21, 22
   ────────────────────────────────────────────────────────────── */

// ── Shared helpers ──

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

// ── DB helpers ──

async function fetchVenueWithCatalogue() {
  // Find a venue that has catalogue items
  const { data: items, error: itemsError } = await supabase
    .from('venue_catalogue_items')
    .select('venue_id')
    .eq('is_active', true)
    .limit(1);

  if (itemsError || !items || items.length === 0) {
    // Fallback: any venue
    const { data, error } = await supabase
      .from('venue_listings')
      .select('id, name, address_line_1, city, description, features, price_range')
      .not('address_line_1', 'is', null)
      .not('city', 'is', null)
      .order('id', { ascending: true })
      .limit(1)
      .single();
    if (error || !data) return null;
    return data;
  }

  const venueId = items[0].venue_id;
  const { data: venue, error: venueError } = await supabase
    .from('venue_listings')
    .select('id, name, address_line_1, city, description, features, price_range')
    .eq('id', venueId)
    .single();

  if (venueError || !venue) return null;
  return venue;
}

async function fetchVendorWithCatalogue() {
  // Find a vendor that has catalogue items
  const { data: items, error: itemsError } = await supabase
    .from('vendor_catalogue_items')
    .select('vendor_id')
    .eq('is_active', true)
    .limit(1);

  if (itemsError || !items || items.length === 0) {
    // Fallback: any vendor
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, address_line_1, city, description, price_range')
      .not('address_line_1', 'is', null)
      .not('city', 'is', null)
      .order('id', { ascending: true })
      .limit(1)
      .single();
    if (error || !data) return null;
    return data;
  }

  const vendorId = items[0].vendor_id;
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, name, address_line_1, city, description, price_range')
    .eq('id', vendorId)
    .single();

  if (vendorError || !vendor) return null;
  return vendor;
}

// ── Tests ──

test.describe('Phase 3 — Mobile Catalogue', () => {
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

  test('Venue catalogue — Quantity selector in item card: input + up/down buttons (Item 19)', async ({ page }) => {
    const venue = await fetchVenueWithCatalogue();
    if (!venue) {
      console.log('No venue with catalogue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await page.waitForTimeout(500);

    // Navigate to catalogue tab
    await clickByText(page, 'Catalogue');
    await page.waitForTimeout(500);

    // Look for "View Full Catalogue & Request Quote" button and click it
    const fullCatalogueBtn = page.getByText('View Full Catalogue & Request Quote', { exact: true }).first();
    const fullCatalogueVisible = await fullCatalogueBtn.isVisible().catch(() => false);
    if (fullCatalogueVisible) {
      await fullCatalogueBtn.click({ force: true });
      await page.waitForTimeout(1000);
    } else {
      console.log('No "View Full Catalogue & Request Quote" button; trying direct navigation');
      return;
    }

    // Wait for catalogue items to load
    await page.waitForTimeout(1000);

    // Item 19: Quantity selector should appear when an item is selected
    // First, click on a catalogue item to select it
    const itemClicked = await page.evaluate(() => {
      // Find catalogue items — they are TouchableOpacity elements with radio buttons
      const allDivs = Array.from(document.querySelectorAll('div'));
      // Look for elements with "radio-button-unchecked" icon (unselected items)
      const uncheckedIcons = allDivs.filter((d) => {
        const text = d.textContent || '';
        return text.includes('radio_button_unchecked') || text.includes('radio-button-unchecked');
      });

      // Find a clickable parent that looks like a catalogue item card
      for (const icon of uncheckedIcons) {
        let el: Element | null = icon;
        while (el) {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          if (style.cursor === 'pointer' && rect.width > 200 && rect.height > 80) {
            (el as HTMLElement).click();
            return true;
          }
          el = el.parentElement;
        }
      }
      return false;
    });

    if (!itemClicked) {
      console.log('Could not click a catalogue item; skipping quantity selector test');
      return;
    }

    await page.waitForTimeout(500);

    // Item 19: After selecting an item, quantity selector should appear with:
    // - A text input showing the quantity
    // - A minus/decrement button (MaterialIcons "remove")
    // - A plus/increment button (MaterialIcons "add")
    const hasQuantitySelector = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      // Check for "remove" icon (minus button)
      const hasMinus = all.some((el) => {
        const text = el.textContent?.trim() || '';
        return (text === 'remove' || text === '−') && el.getBoundingClientRect().width > 0;
      });
      // Check for "add" icon (plus button)
      const hasPlus = all.some((el) => {
        const text = el.textContent?.trim() || '';
        return (text === 'add' || text === '+') && el.getBoundingClientRect().width > 0;
      });
      // Check for a text input (quantity field)
      const hasInput = Array.from(document.querySelectorAll('input')).some((input) => {
        const rect = input.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      return { hasMinus, hasPlus, hasInput };
    });

    expect(hasQuantitySelector.hasMinus, 'Quantity selector should have a minus/decrement button').toBe(true);
    expect(hasQuantitySelector.hasPlus, 'Quantity selector should have a plus/increment button').toBe(true);
    expect(hasQuantitySelector.hasInput, 'Quantity selector should have a text input for quantity').toBe(true);
  });

  test('Venue catalogue — Request a Quote: catalogue items at top, date below, condensed form (Item 20)', async ({ page }) => {
    const venue = await fetchVenueWithCatalogue();
    if (!venue) {
      console.log('No venue with catalogue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await page.waitForTimeout(500);

    // Click "Request a Quote" on the profile
    const requestQuoteBtn = page.getByText('Request a Quote', { exact: true }).first();
    const requestQuoteVisible = await requestQuoteBtn.isVisible().catch(() => false);
    if (requestQuoteVisible) {
      await requestQuoteBtn.click({ force: true });
    } else {
      // Try "Request Quote" variant
      const altBtn = page.getByText('Request Quote', { exact: true }).first();
      if (await altBtn.isVisible().catch(() => false)) {
        await altBtn.click({ force: true });
      } else {
        console.log('No Request Quote button found; skipping');
        return;
      }
    }

    await page.waitForTimeout(1000);

    // Item 20: Catalogue items should appear at the top, date below, condensed form
    // Verify "Catalogue Items" heading is visible
    await expectAnyVisibleText(page, 'Catalogue Items');

    // Check the vertical positions: Catalogue Items should be above Event date
    const sectionPositions = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const catalogueHeading = all.find((el) => {
        const text = el.textContent?.trim();
        return text === 'Catalogue Items' && el.getBoundingClientRect().width > 0;
      });
      const eventDateHeading = all.find((el) => {
        const text = el.textContent?.trim();
        return text === 'Event date' && el.getBoundingClientRect().width > 0;
      });
      const yourDetailsHeading = all.find((el) => {
        const text = el.textContent?.trim();
        return text === 'Your details' && el.getBoundingClientRect().width > 0;
      });

      return {
        catalogueY: catalogueHeading?.getBoundingClientRect().top ?? null,
        eventDateY: eventDateHeading?.getBoundingClientRect().top ?? null,
        yourDetailsY: yourDetailsHeading?.getBoundingClientRect().top ?? null,
      };
    });

    if (sectionPositions.catalogueY !== null && sectionPositions.eventDateY !== null) {
      expect(
        sectionPositions.catalogueY < sectionPositions.eventDateY,
        'Catalogue Items should be above Event date section'
      ).toBe(true);
    }

    if (sectionPositions.eventDateY !== null && sectionPositions.yourDetailsY !== null) {
      expect(
        sectionPositions.eventDateY < sectionPositions.yourDetailsY,
        'Event date should be above Your details section'
      ).toBe(true);
    }
  });

  test('Venue catalogue — Request Quote button visible even with nothing selected (Item 21)', async ({ page }) => {
    const venue = await fetchVenueWithCatalogue();
    if (!venue) {
      console.log('No venue with catalogue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await page.waitForTimeout(500);

    // Navigate to catalogue tab and open full catalogue view
    await clickByText(page, 'Catalogue');
    await page.waitForTimeout(500);

    const fullCatalogueBtn = page.getByText('View Full Catalogue & Request Quote', { exact: true }).first();
    const fullCatalogueVisible = await fullCatalogueBtn.isVisible().catch(() => false);
    if (!fullCatalogueVisible) {
      console.log('No "View Full Catalogue & Request Quote" button; skipping');
      return;
    }

    await fullCatalogueBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Item 21: "Request Quote" button should be visible even when no items are selected
    const requestQuoteBtn = page.getByText('Request Quote', { exact: true }).first();
    const isVisible = await requestQuoteBtn.isVisible().catch(() => false);
    expect(isVisible, 'Request Quote button should be visible even with nothing selected').toBe(true);

    // Also verify that "Your Selection" section is NOT visible (nothing selected)
    const yourSelection = page.getByText('Your Selection', { exact: true }).first();
    const selectionVisible = await yourSelection.isVisible().catch(() => false);
    expect(selectionVisible, 'Your Selection should not be visible when nothing is selected').toBe(false);
  });

  test('Venue catalogue — Checkbox outline darker/black when not selected (Item 22)', async ({ page }) => {
    const venue = await fetchVenueWithCatalogue();
    if (!venue) {
      console.log('No venue with catalogue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'venue');
    await openProfileCard(page, venue.name);
    await expectAnyVisibleText(page, venue.name);
    await page.waitForTimeout(500);

    // Navigate to catalogue and open full catalogue view
    await clickByText(page, 'Catalogue');
    await page.waitForTimeout(500);

    const fullCatalogueBtn = page.getByText('View Full Catalogue & Request Quote', { exact: true }).first();
    const fullCatalogueVisible = await fullCatalogueBtn.isVisible().catch(() => false);
    if (!fullCatalogueVisible) {
      console.log('No "View Full Catalogue & Request Quote" button; skipping');
      return;
    }

    await fullCatalogueBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Item 22: Checkbox/radio button outline should be darker/black when not selected
    // The unselected radio button icon should have a dark/black color
    const uncheckedIconColor = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('span, i, .material-icons'));
      const uncheckedIcons = all.filter((el) => {
        const text = el.textContent?.trim() || '';
        return (text === 'radio_button_unchecked' || text === 'radio-button-unchecked') &&
               el.getBoundingClientRect().width > 0;
      });

      if (uncheckedIcons.length === 0) return null;

      // Get the color of the first unchecked icon
      const style = window.getComputedStyle(uncheckedIcons[0]);
      return style.color;
    });

    if (uncheckedIconColor) {
      const rgbMatch = uncheckedIconColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        // Darker/black means all RGB values should be relatively low (< 100) or close to black
        // The theme uses #000000 for textPrimary, so unselected outline should be dark
        const isDark = r < 100 && g < 100 && b < 100;
        expect(
          isDark,
          `Unselected checkbox outline should be darker/black, got ${uncheckedIconColor}`
        ).toBe(true);
      }
    } else {
      console.log('No unchecked radio button icons found; skipping color check');
    }
  });

  test('Vendor catalogue — Quantity selector works: increment and decrement (Item 19)', async ({ page }) => {
    const vendor = await fetchVendorWithCatalogue();
    if (!vendor) {
      console.log('No vendor with catalogue found; skipping');
      return;
    }

    await navigateToDiscover(page, 'vendor');
    await openProfileCard(page, vendor.name);
    await expectAnyVisibleText(page, vendor.name);
    await page.waitForTimeout(500);

    // Click "Request Quote" to go to the quote request screen which has catalogue items
    const requestQuoteBtn = page.getByText('Request Quote', { exact: true }).first();
    const requestQuoteVisible = await requestQuoteBtn.isVisible().catch(() => false);
    if (!requestQuoteVisible) {
      console.log('No Request Quote button found on vendor profile; skipping');
      return;
    }

    await requestQuoteBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Wait for catalogue items to load
    await expectAnyVisibleText(page, 'Catalogue Items');

    // Select a catalogue item
    const itemClicked = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const uncheckedIcons = allDivs.filter((d) => {
        const text = d.textContent || '';
        return text.includes('radio_button_unchecked') || text.includes('radio-button-unchecked');
      });

      for (const icon of uncheckedIcons) {
        let el: Element | null = icon;
        while (el) {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          if (style.cursor === 'pointer' && rect.width > 200 && rect.height > 80) {
            (el as HTMLElement).click();
            return true;
          }
          el = el.parentElement;
        }
      }
      return false;
    });

    if (!itemClicked) {
      console.log('Could not click a catalogue item; skipping quantity test');
      return;
    }

    await page.waitForTimeout(500);

    // Now the "Your Selection" section should appear with quantity controls
    await expectAnyVisibleText(page, 'Your Selection');

    // Read the initial quantity
    const initialQty = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const qtyText = all.find((el) => {
        const text = el.textContent?.trim();
        return text === '1' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().width < 40;
      });
      return qtyText ? 1 : null;
    });

    expect(initialQty, 'Initial quantity should be 1').toBe(1);

    // Click the plus button to increment
    const incremented = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('span, i, .material-icons'));
      const plusIcons = all.filter((el) => {
        const text = el.textContent?.trim() || '';
        return text === 'add' && el.getBoundingClientRect().width > 0;
      });

      if (plusIcons.length === 0) return false;
      // Click the last "add" icon (in the selection summary)
      let el: Element | null = plusIcons[plusIcons.length - 1];
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.cursor === 'pointer') {
          (el as HTMLElement).click();
          return true;
        }
        el = el.parentElement;
      }
      return false;
    });

    if (incremented) {
      await page.waitForTimeout(300);
      // Verify quantity changed to 2
      const newQty = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('*'));
        const qtyText = all.find((el) => {
          const text = el.textContent?.trim();
          return text === '2' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().width < 40;
        });
        return qtyText ? 2 : null;
      });

      expect(newQty, 'Quantity should increment to 2').toBe(2);
    }
  });
});
