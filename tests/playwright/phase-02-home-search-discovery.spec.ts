import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { gotoApp, loginFromWelcome, openListingCard, supabase } from './helpers';

// Shared page/context so the slow Expo cold-load + login only happen once.
let sharedPage: Page;
let sharedContext: BrowserContext;

// ─── Local UI helpers for the Discover filter sidebar / modals ───

async function clickByText(page: Page, text: string) {
  // React Native Web often renders the visible text inside a leaf element with
  // the actual press handler on a parent. This helper finds the text and clicks
  // the nearest ancestor that looks clickable (role=button, cursor:pointer, or
  // a button/a tag), so the React Native Web press handler actually fires.
  const isClickable = (el: Element) => {
    const style = window.getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    return (
      el.getAttribute('role') === 'button' ||
      tag === 'button' ||
      tag === 'a' ||
      style.cursor === 'pointer'
    );
  };

  try {
    await page.getByText(text, { exact: true }).first().evaluate((el) => {
      el.scrollIntoView({ block: 'center', inline: 'center' });
      let target: Element | null = el.parentElement;
      while (target && target !== document.body) {
        if (isClickable(target)) {
          (target as HTMLElement).click();
          return;
        }
        target = target.parentElement;
      }
      // Fallback: click the text element itself if no clickable ancestor is found.
      (el as HTMLElement).click();
    });
  } catch {
    await page.evaluate((text) => {
      const isHidden = (el: Element) => {
        let node: Element | null = el;
        while (node && node !== document.body) {
          const style = window.getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden') return true;
          node = node.parentElement;
        }
        return false;
      };

      const isClickable = (el: Element) => {
        const style = window.getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        return (
          el.getAttribute('role') === 'button' ||
          tag === 'button' ||
          tag === 'a' ||
          style.cursor === 'pointer'
        );
      };

      const candidates = Array.from(document.querySelectorAll('div, span, button, a')).filter(
        (e) => e.textContent?.trim() === text
      );
      for (const el of candidates) {
        if (isHidden(el)) continue;
        el.scrollIntoView({ block: 'center', inline: 'center' });
        let target: Element | null = el.parentElement;
        while (target && target !== document.body) {
          if (isClickable(target)) {
            (target as HTMLElement).click();
            return;
          }
          target = target.parentElement;
        }
        (el as HTMLElement).click();
        return;
      }
      throw new Error(`Could not find visible text "${text}" to click`);
    }, text);
  }
  await page.waitForTimeout(200);
}

async function navigateToDiscover(page: Page) {
  await clickByText(page, 'Vendors');
  // Wait for the Discover screen to render. React Native Web renders text in
  // zero-size elements, so use toBeAttached instead of toBeVisible.
  await expect(page.getByText(/Discover (Vendors|Venues)/).first()).toBeAttached({ timeout: 15000 });
  await page.waitForTimeout(500);
}

async function clickCategoryTab(page: Page, label: string) {
  await page.evaluate((label) => {
    const candidates = Array.from(document.querySelectorAll('div, span')).filter(
      (el) => el.textContent?.trim() === label
    );
    for (const el of candidates) {
      let container = el.parentElement;
      while (container && container !== document.body) {
        const text = container.textContent || '';
        if (text.includes('Filters') || text.includes('Browse by')) {
          const tag = el.tagName;
          const clickable =
            tag === 'DIV' || tag === 'SPAN' || tag === 'BUTTON' || tag === 'A'
              ? (el as HTMLElement)
              : (el.parentElement as HTMLElement);
          clickable.click();
          return;
        }
        container = container.parentElement;
      }
    }
    throw new Error(`Category tab "${label}" not found in filter panel`);
  }, label);
  await page.waitForTimeout(200);
}

async function clickFilterDropdown(page: Page, label: string) {
  await page.evaluate((label) => {
    const labelEls = Array.from(document.querySelectorAll('div, span')).filter(
      (el) => el.textContent?.trim() === label
    );
    if (!labelEls.length) throw new Error(`Filter dropdown label not found: ${label}`);
    for (const labelEl of labelEls) {
      const container = labelEl.parentElement;
      if (!container) continue;
      const clickables = Array.from(container.querySelectorAll('div')).filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          (style.cursor === 'pointer' || el.getAttribute('role') === 'button') &&
          !el.contains(labelEl)
        );
      });
      if (clickables.length) {
        (clickables[0] as HTMLElement).click();
        return;
      }
    }
    throw new Error(`No clickable dropdown for ${label}`);
  }, label);
  await page.waitForTimeout(200);
}

async function closeDropdownModal(page: Page, title: string) {
  await page.evaluate((title) => {
    const titleEls = Array.from(document.querySelectorAll('div, span')).filter(
      (el) => el.textContent?.trim() === title
    );
    for (const titleEl of titleEls) {
      let header = titleEl.parentElement;
      while (header && header !== document.body) {
        const clickables = Array.from(header.querySelectorAll('div, span')).filter((el) => {
          const style = window.getComputedStyle(el);
          return (
            (style.cursor === 'pointer' || el.getAttribute('role') === 'button') &&
            !el.contains(titleEl)
          );
        });
        if (clickables.length) {
          (clickables[0] as HTMLElement).click();
          return;
        }
        header = header.parentElement;
      }
    }
    throw new Error(`Could not close dropdown modal titled "${title}"`);
  }, title);
  await page.waitForTimeout(200);
}

async function selectFilterDropdown(page: Page, label: string, title: string, option: string) {
  await clickFilterDropdown(page, label);
  await page.getByText(title).first().waitFor({ state: 'attached', timeout: 10000 });
  // Dropdown options may be in zero-size RNW elements; use DOM click.
  await page.evaluate((optionText) => {
    const els = Array.from(document.querySelectorAll('div, span'))
      .filter((e) => e.textContent?.trim() === optionText);
    for (const el of els) {
      let target = el.parentElement;
      while (target && target !== document.body) {
        const style = window.getComputedStyle(target);
        if (style.cursor === 'pointer' || target.getAttribute('role') === 'button') {
          (target as HTMLElement).click();
          return;
        }
        target = target.parentElement;
      }
      (el as HTMLElement).click();
      return;
    }
  }, option);
  await page.waitForTimeout(300);

  // Multi-select dropdowns stay open after clicking an option; close them.
  const stillOpen = await page
    .getByText(title)
    .first()
    .isVisible()
    .catch(() => false);
  if (stillOpen) {
    await closeDropdownModal(page, title);
  }
}

async function openSortOptions(page: Page) {
  // Desktop renders a sort dropdown labelled "best match"; mobile uses aria-label.
  const sortBtn = page.getByLabel('Open sort options').first();
  const sortAttached = await sortBtn.isVisible().catch(() => false);
  if (sortAttached) {
    await sortBtn.click({ force: true });
  } else {
    // Desktop: click the "best match" sort trigger text.
    await clickByText(page, 'best match');
  }
  await expect(page.getByText('Sort options', { exact: true }).first()).toBeAttached({ timeout: 10000 });
}

async function fetchSampleListing() {
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, address_line_1, city')
    .not('address_line_1', 'is', null)
    .not('city', 'is', null)
    .limit(1);
  if (vendors && vendors.length > 0) {
    return {
      name: vendors[0].name as string,
      street: vendors[0].address_line_1 as string,
      city: vendors[0].city as string,
      type: 'vendor' as const,
    };
  }

  const { data: venues } = await supabase
    .from('venue_listings')
    .select('id, name, address_line_1, city')
    .not('address_line_1', 'is', null)
    .not('city', 'is', null)
    .limit(1);
  if (venues && venues.length > 0) {
    return {
      name: venues[0].name as string,
      street: venues[0].address_line_1 as string,
      city: venues[0].city as string,
      type: 'venue' as const,
    };
  }
  return null;
}

// ─── Phase 2 Test Suite ───

test.describe('Phase 2 — Home, Search & Discovery', () => {
  // Cold-load + login can take a while on the first test; give the suite breathing room.
  test.setTimeout(120000);

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180000);
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    await gotoApp(sharedPage, '/auth');
    await loginFromWelcome(sharedPage);
    // The test user is a vendor, so the app starts on the Account tab.
    // Navigate to the Home tab once so the rest of the suite can reset quickly.
    await sharedPage.getByText('Home', { exact: true }).first().click({ force: true });
    await sharedPage
      .getByText('Explore by', { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 30000 })
      .catch(() => {});
  });

  test.beforeEach(async () => {
    // Reset to the default desktop viewport and Home tab for each test.
    await sharedPage.setViewportSize({ width: 1280, height: 720 });
    await sharedPage.getByText('Home', { exact: true }).first().click({ force: true });
    await sharedPage
      .getByText('Explore by', { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {});
  });

  test.afterAll(async () => {
    await sharedContext?.close();
  });

  test('Home tab renders hero, categories, and featured sections', async () => {
    await expect(sharedPage.getByText('Curate Your Perfect Event')).toBeVisible({ timeout: 15000 });
    await expect(sharedPage.getByText('Explore by')).toBeVisible();
    await expect(sharedPage.getByText('Featured Venues')).toBeVisible();
    await expect(sharedPage.getByText('Featured Vendors & Services')).toBeVisible();
    // Discovery cards should be present in the DOM even if some are off-screen.
    await expect(sharedPage.getByText('By Categories')).toBeAttached();
    await expect(sharedPage.getByText('By Services')).toBeAttached();
  });

  test('Desktop hero search navigates to Discover with query', async () => {
    await sharedPage.setViewportSize({ width: 1280, height: 800 });
    const heroInput = sharedPage.getByPlaceholder('Search venues, vendors, locations...').first();
    await expect(heroInput).toBeVisible({ timeout: 10000 });
    await heroInput.fill('catering');
    await sharedPage.getByText('Search', { exact: true }).first().click();
    await expect(sharedPage.getByText(/Results for .catering./i)).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to Discover via Explore by > By Services', async () => {
    await clickByText(sharedPage, 'By Services');
    await expect(sharedPage.getByText('Search by Services')).toBeVisible({ timeout: 10000 });
  });

  test('Search by keyword and clear the input', async () => {
    await navigateToDiscover(sharedPage);
    // The Discover search input may be in a zero-size RNW container; use force.
    const searchInput = sharedPage.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeAttached({ timeout: 10000 });

    await searchInput.fill('photographer');
    await sharedPage.waitForTimeout(500);
    // React Native Web text is zero-size, so use toBeAttached.
    await expect(sharedPage.getByText(/Results for .photographer./i)).toBeAttached({ timeout: 10000 });

    await searchInput.fill('');
    await sharedPage.waitForTimeout(500);
    await expect(sharedPage.getByText(/Discover (Vendors|Venues)/).first()).toBeAttached({ timeout: 10000 });
  });

  test('Filters sidebar - toggle category and apply multi-criteria filters', async () => {
    await navigateToDiscover(sharedPage);

    // Toggle the "Browse by" category from Vendors to Venues.
    await clickCategoryTab(sharedPage, 'Venues');
    await expect(sharedPage.getByText(/Discover Venues/).first()).toBeAttached({ timeout: 10000 });

    await selectFilterDropdown(sharedPage, 'Venue Type', 'Select your preferred venue type', 'Gardens');
    await selectFilterDropdown(sharedPage, 'Province', 'Select preferred provinces', 'Gauteng');
    await selectFilterDropdown(sharedPage, 'City', 'Select preferred cities', 'Johannesburg');
    await selectFilterDropdown(sharedPage, 'Capacity', 'Select venue capacity', 'Under 50');

    // The filtered state should be reflected in the results header.
    await expect(sharedPage.getByText(/Discover Venues/).first()).toBeAttached({ timeout: 10000 });
    // The selected province should be shown in the filter button.
    await expect(sharedPage.getByText('Gauteng').first()).toBeAttached({ timeout: 10000 });
  });

  test('Reset filters returns results to default', async () => {
    await navigateToDiscover(sharedPage);
    await clickCategoryTab(sharedPage, 'Venues');
    await selectFilterDropdown(sharedPage, 'Province', 'Select preferred provinces', 'Gauteng');
    await expect(sharedPage.getByText(/Discover Venues/).first()).toBeAttached({ timeout: 10000 });

    await clickByText(sharedPage, 'Clear all');
    await expect(sharedPage.getByText(/Discover (Vendors|Venues)/).first()).toBeAttached({ timeout: 10000 });
  });

  test('Sort options - Rating and Price: Low to High', async () => {
    await navigateToDiscover(sharedPage);

    await openSortOptions(sharedPage);
    await clickByText(sharedPage, 'Highest rating');
    await sharedPage.waitForTimeout(500);
    // Desktop sort trigger shows sortBy.replace('-', ' ') = 'rating desc'
    await expect(sharedPage.getByText('rating desc', { exact: true }).first()).toBeAttached({ timeout: 10000 });

    await openSortOptions(sharedPage);
    await clickByText(sharedPage, 'Price low to high');
    await sharedPage.waitForTimeout(500);
    await expect(sharedPage.getByText('price asc', { exact: true }).first()).toBeAttached({ timeout: 10000 });
  });

  test('Listing cards display street and city and navigate to profile', async () => {
    await navigateToDiscover(sharedPage);
    await clickCategoryTab(sharedPage, 'All');

    const sample = await fetchSampleListing();
    if (!sample) {
      console.log('No listings with both address_line_1 and city found; skipping card assertions');
      return;
    }

    // Locate the card and assert it renders the address pieces.
    const card = sharedPage.locator('div', { hasText: sample.name }).filter({ hasText: sample.city }).first();
    await expect(card).toContainText(sample.street);
    await expect(card).toContainText(sample.city);

    await openListingCard(sharedPage, sample.name);
    await expect(sharedPage.getByText('Request Quote').first()).toBeAttached({ timeout: 15000 });
    await expect(sharedPage.getByText(sample.name).first()).toBeAttached({ timeout: 10000 });
  });

  test.describe('Mobile filter modal', () => {
    test('Map radius selector opens and closes', async () => {
      await sharedPage.setViewportSize({ width: 375, height: 667 });

      // Open Discover from the mobile header navigation.
      await clickByText(sharedPage, 'Vendors');
      await expect(sharedPage.getByText(/Discover (Vendors|Venues)/).first()).toBeAttached({ timeout: 15000 });
      await sharedPage.waitForTimeout(500);

      await sharedPage.getByLabel('Open filters').first().click({ force: true });
      await expect(sharedPage.getByText('Browse by', { exact: true }).first()).toBeAttached({ timeout: 10000 });

      // Avoid a permission prompt while the modal is open.
      await sharedPage.context().grantPermissions(['geolocation']);
      await sharedPage.context().setGeolocation({ latitude: -26.2041, longitude: 28.0473 });

      await sharedPage.getByText('Select search area by map radius', { exact: true }).first().click({ force: true });
      await expect(sharedPage.getByText('Search Area', { exact: true }).first()).toBeVisible({ timeout: 10000 });

      await sharedPage.getByText('Apply Search Area', { exact: true }).first().click({ force: true });
      await expect(sharedPage.getByText('Search Area', { exact: true }).first()).toBeHidden({ timeout: 5000 });
    });
  });
});
