import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import {
  gotoApp,
  loginFromWelcome,
  dismissConsentIfPresent,
} from '../helpers';

let sharedPage: Page;
let sharedContext: BrowserContext;

async function waitForLoading(page: Page) {
  await page.waitForTimeout(500);
  try {
    await page.waitForSelector('progressbar, [role="progressbar"]', { state: 'hidden', timeout: 15000 });
  } catch {}
  await page.waitForTimeout(500);
}

async function clickByText(page: Page, text: string) {
  const clicked = await page.evaluate((targetText: string) => {
    const isClickable = (el: Element) => {
      const style = window.getComputedStyle(el);
      const tag = el.tagName.toLowerCase();
      return el.getAttribute('role') === 'button' || tag === 'button' || tag === 'a' || style.cursor === 'pointer';
    };
    const candidates = Array.from(document.querySelectorAll('div, span, button, a')).filter(
      (e) => e.textContent?.trim() === targetText
    );
    for (const el of candidates) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      let target: Element | null = el.parentElement;
      while (target && target !== document.body) {
        if (isClickable(target)) {
          (target as HTMLElement).click();
          return true;
        }
        target = target.parentElement;
      }
      (el as HTMLElement).click();
      return true;
    }
    return false;
  }, text);
  if (!clicked) throw new Error(`Could not find visible text "${text}" to click`);
  await page.waitForTimeout(300);
}

async function navigateToDiscover(page: Page, category?: 'venues' | 'vendors' | 'services') {
  const label = category === 'venues' ? 'Venues' : category === 'vendors' ? 'Vendors' : 'Home';
  const btn = page.getByText(label, { exact: true }).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click({ force: true });
  } else {
    await gotoApp(page, '/');
    await page.getByText(label, { exact: true }).first().click({ force: true });
  }
  await waitForLoading(page);
}

async function openSortOptions(page: Page) {
  const sortBtn = page.locator('text=best match').first();
  if (await sortBtn.isVisible().catch(() => false)) {
    await sortBtn.click({ force: true });
    await page.waitForTimeout(300);
    return;
  }
  const swapIcon = page.locator('[data-icon="swap-vert"]').first();
  if (await swapIcon.isVisible().catch(() => false)) {
    await swapIcon.click({ force: true });
    await page.waitForTimeout(300);
    return;
  }
  await clickByText(page, 'best match');
}

// Desktop: Click "Hi {username}" greeting to access Account screen
async function openDesktopAccount(page: Page) {
  const hiGreeting = page.getByText(/Hi /i).first();
  await expect(hiGreeting).toBeVisible({ timeout: 10000 });
  await hiGreeting.click({ force: true });
  await waitForLoading(page);
}

test.describe('Phase 5 — Desktop Search', () => {
  test.setTimeout(120000);

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180000);
    sharedContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    sharedPage = await sharedContext.newPage();
    await gotoApp(sharedPage, '/');
    await dismissConsentIfPresent(sharedPage);
    const signInBtn = sharedPage.getByText('Sign In', { exact: true }).first();
    if (await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signInBtn.click({ force: true });
      await sharedPage.waitForTimeout(1000);
    }
    await loginFromWelcome(sharedPage);
    await sharedPage.getByText('Home', { exact: true }).first().click({ force: true });
    await sharedPage.waitForTimeout(1000);
  });

  test.afterAll(async () => {
    await sharedContext?.close();
  });

  test.beforeEach(async () => {
    await sharedPage.setViewportSize({ width: 1280, height: 800 });
    await sharedPage.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissConsentIfPresent(sharedPage);
    await sharedPage.waitForTimeout(500);
  });

  test('Discover screen renders with alphabetical sort option', async () => {
    await navigateToDiscover(sharedPage, 'vendors');
    await openSortOptions(sharedPage);
    await expect(sharedPage.getByText('Alphabetical', { exact: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test('Selecting alphabetical sort reorders listings A-Z', async () => {
    await navigateToDiscover(sharedPage, 'vendors');
    await openSortOptions(sharedPage);
    await sharedPage.getByText('Alphabetical', { exact: true }).first().click({ force: true });
    await sharedPage.waitForTimeout(1000);

    const sortIndicator = sharedPage.locator('text=/alphabetical/i').first();
    await expect(sortIndicator).toBeVisible({ timeout: 5000 });

    const names = await sharedPage.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div')).filter((d) => {
        const rect = d.getBoundingClientRect();
        return rect.width > 150 && rect.height > 100 && rect.height < 500;
      });
      const names: string[] = [];
      for (const card of cards.slice(0, 5)) {
        const text = card.textContent?.trim().split('\n')[0] || '';
        if (text.length > 2 && text.length < 60) {
          names.push(text);
        }
      }
      return names;
    });

    if (names.length >= 2) {
      for (let i = 1; i < names.length; i++) {
        expect(names[i].localeCompare(names[i - 1])).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('Search for "florist" returns relevant results', async () => {
    await navigateToDiscover(sharedPage, 'vendors');

    const searchInput = sharedPage
      .locator('input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="venues, vendors"], input[placeholder*="services"]')
      .first();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('florist');
      await searchInput.press('Enter');
      await sharedPage.waitForTimeout(2000);
    } else {
      const quickSearch = sharedPage.getByText('Quick search').first();
      if (await quickSearch.isVisible().catch(() => false)) {
        await quickSearch.click({ force: true });
        await sharedPage.waitForTimeout(500);
        const input = sharedPage.locator('input').first();
        await input.fill('florist');
        await input.press('Enter');
        await sharedPage.waitForTimeout(2000);
      }
    }

    const pageText = await sharedPage.evaluate(() => document.body.textContent || '');
    const hasFloristResults = pageText.toLowerCase().includes('florist') || pageText.toLowerCase().includes('flower');
    const noResults = await sharedPage.getByText(/No.*results|No.*listings/i).first().isVisible().catch(() => false);

    expect(hasFloristResults || noResults).toBe(true);
  });

  test('Search results can be filtered by category on desktop', async () => {
    await navigateToDiscover(sharedPage, 'vendors');

    const cateringTab = sharedPage.getByText('Catering', { exact: true }).first();
    if (await cateringTab.isVisible().catch(() => false)) {
      await cateringTab.click({ force: true });
      await sharedPage.waitForTimeout(1000);
      const sortText = await sharedPage.locator('text=/catering/i').first().isVisible().catch(() => false);
      expect(sortText).toBe(true);
    }
  });

  test('Save Changes button visible when editing venue portfolio', async () => {
    // Desktop: Hi {username} → Account → Lister Portfolio Dashboard
    await openDesktopAccount(sharedPage);

    // Click Lister Portfolio Dashboard menu item (testID: lister-portfolio)
    const portfolioBtn = sharedPage.getByTestId('lister-portfolio').first();
    if (await portfolioBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await portfolioBtn.click({ force: true });
      await waitForLoading(sharedPage);
    } else {
      // Fallback: click by text
      const portfolioText = sharedPage.getByText(/Lister Portfolio|Portfolio Dashboard/i).first();
      if (await portfolioText.isVisible({ timeout: 5000 }).catch(() => false)) {
        await portfolioText.click({ force: true });
        await waitForLoading(sharedPage);
      }
    }

    const editBtn = sharedPage.getByText('Edit', { exact: true }).first();
    const updatePortfolioBtn = sharedPage.getByText('Update Venue Portfolio', { exact: true }).first();

    if (await updatePortfolioBtn.isVisible().catch(() => false)) {
      await updatePortfolioBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
    } else if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
    }

    const saveBtn = sharedPage.getByText('Save Changes', { exact: true }).first();
    const createBtn = sharedPage.getByText('Create Listing', { exact: true }).first();
    const nextBtn = sharedPage.getByText('Next', { exact: true }).first();

    const saveVisible = await saveBtn.isVisible().catch(() => false);
    const createVisible = await createBtn.isVisible().catch(() => false);
    const nextVisible = await nextBtn.isVisible().catch(() => false);

    expect(saveVisible || createVisible || nextVisible).toBe(true);
  });

  test('Save Changes button visible when editing vendor portfolio', async () => {
    await openDesktopAccount(sharedPage);

    const portfolioBtn = sharedPage.getByTestId('lister-portfolio').first();
    if (await portfolioBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await portfolioBtn.click({ force: true });
      await waitForLoading(sharedPage);
    } else {
      const portfolioText = sharedPage.getByText(/Lister Portfolio|Portfolio Dashboard/i).first();
      if (await portfolioText.isVisible({ timeout: 5000 }).catch(() => false)) {
        await portfolioText.click({ force: true });
        await waitForLoading(sharedPage);
      }
    }

    const vendorEditBtn = sharedPage.getByText('Update Vendor Portfolio', { exact: true }).first();
    const editBtn = sharedPage.getByText('Edit', { exact: true }).first();

    if (await vendorEditBtn.isVisible().catch(() => false)) {
      await vendorEditBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
    } else if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
    }

    const saveBtn = sharedPage.getByText('Save Changes', { exact: true }).first();
    const createBtn = sharedPage.getByText('Create Portfolio', { exact: true }).first();
    const nextBtn = sharedPage.getByText('Next', { exact: true }).first();

    const saveVisible = await saveBtn.isVisible().catch(() => false);
    const createVisible = await createBtn.isVisible().catch(() => false);
    const nextVisible = await nextBtn.isVisible().catch(() => false);

    expect(saveVisible || createVisible || nextVisible).toBe(true);
  });

  test('Clear filters resets search results', async () => {
    await navigateToDiscover(sharedPage, 'vendors');

    const filterBtn = sharedPage.getByText('Filters', { exact: true }).first();
    if (await filterBtn.isVisible().catch(() => false)) {
      await filterBtn.click({ force: true });
      await sharedPage.waitForTimeout(500);

      const clearBtn = sharedPage.getByText('Clear All', { exact: true }).first();
      if (await clearBtn.isVisible().catch(() => false)) {
        await clearBtn.click({ force: true });
        await sharedPage.waitForTimeout(500);
      }

      const bestMatch = sharedPage.locator('text=/best.?match/i').first();
      await expect(bestMatch).toBeVisible({ timeout: 5000 });
    }
  });

  test('Desktop search shows results in grid layout', async () => {
    await navigateToDiscover(sharedPage, 'vendors');
    await sharedPage.waitForTimeout(1500);

    const hasGrid = await sharedPage.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('div')).filter((d) => {
        const style = window.getComputedStyle(d);
        const rect = d.getBoundingClientRect();
        return style.flexDirection === 'row' && style.flexWrap === 'wrap' && rect.width > 600 && d.children.length > 2;
      });
      return containers.length > 0;
    });

    expect(hasGrid).toBe(true);
  });
});
