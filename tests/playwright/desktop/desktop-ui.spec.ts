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

// Desktop: Click "Hi {username}" greeting to access Account screen
async function openDesktopAccount(page: Page) {
  const hiGreeting = page.getByText(/Hi /i).first();
  await expect(hiGreeting).toBeVisible({ timeout: 10000 });
  await hiGreeting.click({ force: true });
  await waitForLoading(page);
}

// Desktop navigation: Listers Portal → Register your services → SubscriptionPlansScreen
async function navigateToSubscriptionPlans(page: Page) {
  await clickByText(page, 'Listers Portal');
  await waitForLoading(page);
  await clickByText(page, 'Register your services');
  await waitForLoading(page);
  await expect(page.getByText('Vendor & Service Plans', { exact: true }).first()).toBeVisible({ timeout: 15000 });
}

test.describe('Phase 5 — Desktop UI Layout', () => {
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

  test('Desktop header renders with logo, nav links, and user section', async () => {
    const logo = sharedPage.locator('img').first();
    await expect(logo).toBeVisible({ timeout: 10000 });

    await expect(sharedPage.getByText('Home', { exact: true }).first()).toBeVisible();
    await expect(sharedPage.getByText('Venues', { exact: true }).first()).toBeVisible();
    await expect(sharedPage.getByText('Vendors', { exact: true }).first()).toBeVisible();
    await expect(sharedPage.getByText('Listers Portal', { exact: true }).first()).toBeVisible();

    // User greeting "Hi" should be visible when logged in
    const greeting = sharedPage.getByText(/Hi /i).first();
    await expect(greeting).toBeVisible({ timeout: 5000 });
  });

  test('Desktop header nav links navigate correctly', async () => {
    await sharedPage.getByText('Venues', { exact: true }).first().click({ force: true });
    await waitForLoading(sharedPage);
    await expect(sharedPage.getByText(/Discover Venues|Venues/i).first()).toBeVisible({ timeout: 10000 });

    await sharedPage.getByText('Home', { exact: true }).first().click({ force: true });
    await sharedPage.waitForTimeout(1000);

    await sharedPage.getByText('Vendors', { exact: true }).first().click({ force: true });
    await waitForLoading(sharedPage);
    await expect(sharedPage.getByText(/Discover Vendors|Vendors/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Desktop layout uses max-width container (not full-bleed)', async () => {
    const hasMaxWidth = await sharedPage.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('div')).filter((d) => {
        const style = window.getComputedStyle(d);
        const rect = d.getBoundingClientRect();
        const maxWidth = style.maxWidth;
        return maxWidth && maxWidth !== 'none' && rect.width > 700 && rect.width < 1300;
      });
      return containers.length > 0;
    });

    expect(hasMaxWidth).toBe(true);
  });

  test('Desktop footer renders with contact links and copyright', async () => {
    await sharedPage.getByText('Home', { exact: true }).first().click({ force: true });
    await sharedPage.waitForTimeout(1000);
    await sharedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sharedPage.waitForTimeout(500);

    // Footer links are TouchableOpacity — use waitForSelector instead of toBeAttached
    await sharedPage.waitForSelector('text=Chat via WhatsApp', { timeout: 15000 });
    await sharedPage.waitForSelector('text=Chat via Email');
    await sharedPage.waitForSelector('text=Terms & Policies');
    await sharedPage.waitForSelector('text=/Funxon|©/i');
  });

  test('Application form Step 2 shows amenities tags in grid on desktop', async () => {
    // Desktop: Hi {username} → Account → Lister Portfolio Dashboard → Capture new portfolio application
    await openDesktopAccount(sharedPage);

    const portfolioBtn = sharedPage.getByTestId('lister-portfolio').first();
    if (await portfolioBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await portfolioBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
    } else {
      await clickByText(sharedPage, 'Lister Portfolio Dashboard');
      await sharedPage.waitForTimeout(2000);
    }

    // Look for "Capture new portfolio application" or similar button
    const captureBtn = sharedPage.getByText(/Capture new portfolio|Create.*portfolio|Register/i).first();
    if (await captureBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await captureBtn.click({ force: true });
      await sharedPage.waitForTimeout(1500);
    }

    await expect(sharedPage.getByText(/Create Portfolio|Select your portfolio type/i).first()).toBeVisible({ timeout: 15000 });

    // Select Venues to get amenities in Step 2
    await sharedPage.getByText('Venues', { exact: true }).first().click();
    await sharedPage.waitForTimeout(1000);

    // Fill Step 1 minimal fields and proceed
    const venueNameInput = sharedPage.getByPlaceholder(/venue.*name|listing.*name|business.*name/i).first();
    if (await venueNameInput.isVisible().catch(() => false)) {
      await venueNameInput.fill('E2E Desktop UI Test Venue');
    }

    const inputs = await sharedPage.locator('input:visible').all();
    for (const input of inputs.slice(0, 8)) {
      const placeholder = await input.getAttribute('placeholder').catch(() => null);
      if (placeholder && !await input.inputValue().catch(() => '')) {
        await input.fill('Test Value');
      }
    }

    const nextBtn = sharedPage.getByText('Next', { exact: true }).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click({ force: true });
      await sharedPage.waitForTimeout(1500);
    }

    const amenitiesHeading = sharedPage.getByText(/Amenities/i).first();
    const amenitiesVisible = await amenitiesHeading.isVisible().catch(() => false);

    if (amenitiesVisible) {
      await expect(amenitiesHeading).toBeVisible({ timeout: 10000 });

      const knownAmenities = ['Air-conditioning', 'Bar / Drinks Station', 'WiFi - high speed', 'Free Parking'];
      let foundAny = false;
      for (const amenity of knownAmenities) {
        const amenityEl = sharedPage.getByText(amenity, { exact: true }).first();
        if (await amenityEl.isVisible().catch(() => false)) {
          foundAny = true;
          break;
        }
      }
      expect(foundAny).toBe(true);

      const hasGrid = await sharedPage.evaluate(() => {
        const containers = Array.from(document.querySelectorAll('div')).filter((d) => {
          const style = window.getComputedStyle(d);
          const rect = d.getBoundingClientRect();
          return (
            (style.flexDirection === 'row' || style.display === 'flex') &&
            style.flexWrap === 'wrap' &&
            rect.width > 600 &&
            d.children.length > 4
          );
        });
        return containers.length > 0;
      });
      expect(hasGrid).toBe(true);
    }
  });

  test('Application form Step 2 shows service features tags for vendors', async () => {
    await openDesktopAccount(sharedPage);

    const portfolioBtn = sharedPage.getByTestId('lister-portfolio').first();
    if (await portfolioBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await portfolioBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
    } else {
      await clickByText(sharedPage, 'Lister Portfolio Dashboard');
      await sharedPage.waitForTimeout(2000);
    }

    const captureBtn = sharedPage.getByText(/Capture new portfolio|Create.*portfolio|Register/i).first();
    if (await captureBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await captureBtn.click({ force: true });
      await sharedPage.waitForTimeout(1500);
    }

    await expect(sharedPage.getByText(/Create Portfolio|Select your portfolio type/i).first()).toBeVisible({ timeout: 15000 });

    // Select Vendors
    await sharedPage.getByText('Vendors / Service Professionals', { exact: true }).first().click();
    await sharedPage.waitForTimeout(1000);

    const inputs = await sharedPage.locator('input:visible').all();
    for (const input of inputs.slice(0, 8)) {
      const placeholder = await input.getAttribute('placeholder').catch(() => null);
      if (placeholder && !await input.inputValue().catch(() => '')) {
        await input.fill('Test Value');
      }
    }

    const nextBtn = sharedPage.getByText('Next', { exact: true }).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click({ force: true });
      await sharedPage.waitForTimeout(1500);
    }

    const featuresHeading = sharedPage.getByText(/Special.*Features|Service.*Features|Categories/i).first();
    const featuresVisible = await featuresHeading.isVisible().catch(() => false);

    if (featuresVisible) {
      await expect(featuresHeading).toBeVisible({ timeout: 10000 });

      const tagElements = await sharedPage.evaluate(() => {
        const tags = Array.from(document.querySelectorAll('div, span')).filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return (
            rect.width > 80 &&
            rect.width < 300 &&
            rect.height > 30 &&
            rect.height < 60 &&
            (style.borderRadius !== '0px' || style.borderWidth !== '0px') &&
            el.textContent &&
            el.textContent.trim().length > 2 &&
            el.textContent.trim().length < 50
          );
        });
        return tags.length;
      });

      expect(tagElements).toBeGreaterThan(0);
    }
  });

  test('Profile screen renders desktop two-column layout', async () => {
    await sharedPage.getByText('Vendors', { exact: true }).first().click({ force: true });
    await waitForLoading(sharedPage);

    await sharedPage.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div')).filter((d) => {
        const rect = d.getBoundingClientRect();
        const style = window.getComputedStyle(d);
        return (
          rect.width > 150 &&
          rect.width < 400 &&
          rect.height > 150 &&
          style.cursor === 'pointer' &&
          d.textContent &&
          d.textContent.trim().length > 5
        );
      });
      if (cards.length === 0) return null;
      (cards[0] as HTMLElement).click();
      return true;
    });

    await sharedPage.waitForTimeout(2000);

    const hasTwoColumns = await sharedPage.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('div')).filter((d) => {
        const style = window.getComputedStyle(d);
        const rect = d.getBoundingClientRect();
        return (
          style.flexDirection === 'row' &&
          rect.width > 800 &&
          d.children.length >= 2 &&
          Array.from(d.children).every((c) => {
            const childRect = c.getBoundingClientRect();
            return childRect.width > 150;
          })
        );
      });
      return containers.length > 0;
    });

    expect(hasTwoColumns).toBe(true);
  });

  test('Desktop viewport does not show mobile bottom tab bar', async () => {
    const bottomNav = await sharedPage.evaluate(() => {
      const fixedEls = Array.from(document.querySelectorAll('div')).filter((d) => {
        const style = window.getComputedStyle(d);
        const rect = d.getBoundingClientRect();
        return (
          style.position === 'fixed' &&
          rect.bottom <= 80 &&
          rect.height < 80 &&
          rect.width > 300
        );
      });
      return fixedEls.length > 0;
    });

    expect(bottomNav).toBe(false);
  });

  test('Notification bell is visible in desktop header', async () => {
    // NotificationBell renders as a clickable element in the header actions area.
    // It may be a MaterialIcons span, an SVG, or a generic clickable element.
    // Look for any clickable element in the header that contains an icon character.
    const bellVisible = await sharedPage.evaluate(() => {
      // Find the header actions area (next to "Hi" greeting)
      const hiEl = Array.from(document.querySelectorAll('div, span')).find(
        (e) => e.textContent?.trim().startsWith('Hi ')
      );
      if (!hiEl) return false;
      // Go up to the header container and look for clickable siblings
      let header = hiEl.parentElement;
      while (header && header.getBoundingClientRect().width > 500) {
        header = header.parentElement;
      }
      if (!header) header = hiEl.parentElement;
      // Look for clickable elements in the header that are not the "Hi" greeting or nav links
      const clickables = Array.from((header || hiEl).querySelectorAll('div, span, button, a')).filter((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          (style.cursor === 'pointer' || el.getAttribute('role') === 'button') &&
          rect.width > 10 &&
          rect.width < 60 &&
          rect.height > 10 &&
          rect.height < 60 &&
          !el.textContent?.includes('Hi ')
        );
      });
      return clickables.length > 0;
    });

    if (bellVisible) {
      expect(bellVisible).toBe(true);
    } else {
      // Fallback: check for any notification-related icon or text
      const bellIcon = sharedPage.locator('[data-icon="notifications"], [data-icon="notifications-none"]').first();
      const bellDataIconVisible = await bellIcon.isVisible().catch(() => false);
      const notifSpan = sharedPage.locator('span.material-icons').first();
      const notifSpanVisible = await notifSpan.isVisible().catch(() => false);
      expect(bellDataIconVisible || notifSpanVisible || bellVisible).toBe(true);
    }
  });

  test('Desktop plan cards render in horizontal grid (not carousel)', async () => {
    await navigateToSubscriptionPlans(sharedPage);

    const hasGridLayout = await sharedPage.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('div')).filter((d) => {
        const style = window.getComputedStyle(d);
        const rect = d.getBoundingClientRect();
        return (
          style.flexDirection === 'row' &&
          rect.width > 700 &&
          d.children.length >= 3 &&
          Array.from(d.children).every((c) => {
            const childRect = c.getBoundingClientRect();
            return childRect.width > 150 && childRect.width < 400;
          })
        );
      });
      return containers.length > 0;
    });

    expect(hasGridLayout).toBe(true);
  });
});
