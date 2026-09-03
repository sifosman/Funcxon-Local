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

// Desktop navigation: Listers Portal → Register your services → SubscriptionPlansScreen
async function navigateToSubscriptionPlans(page: Page) {
  await clickByText(page, 'Listers Portal');
  await waitForLoading(page);

  await clickByText(page, 'Register your services');
  await waitForLoading(page);

  await expect(page.getByText('Vendor & Service Plans', { exact: true }).first()).toBeVisible({ timeout: 15000 });
}

// Desktop navigation: Listers Portal → Register your venue → VenueListingPlansScreen
async function navigateToVenuePlans(page: Page) {
  await clickByText(page, 'Listers Portal');
  await waitForLoading(page);

  await clickByText(page, 'Register your venue');
  await waitForLoading(page);
}

test.describe('Phase 5 — Desktop Registration & Plans', () => {
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

  test('Vendor subscription plans screen shows desktop grid with 3 plan cards', async () => {
    await navigateToSubscriptionPlans(sharedPage);

    // Desktop should render plan cards in a grid (not carousel)
    await expect(sharedPage.getByText('Basic Package', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(sharedPage.getByText('Premium', { exact: true }).first()).toBeVisible();
    await expect(sharedPage.getByText('Premium Plus', { exact: true }).first()).toBeVisible();

    // Badges should be visible
    await expect(sharedPage.getByText('Get Noticed', { exact: true }).first()).toBeVisible();
    await expect(sharedPage.getByText('Most Popular', { exact: true }).first()).toBeVisible();
    await expect(sharedPage.getByText('Best Value', { exact: true }).first()).toBeVisible();
  });

  test('Billing toggle switches between Monthly and Yearly prices', async () => {
    await navigateToSubscriptionPlans(sharedPage);

    // Default is monthly — R299 for Premium
    await expect(sharedPage.getByText('R299').first()).toBeVisible({ timeout: 10000 });

    // Click Yearly toggle
    await clickByText(sharedPage, 'Yearly (Save 20%)');
    await sharedPage.waitForTimeout(500);

    // Yearly price should show R3,289 for Premium
    await expect(sharedPage.getByText('R3,289').first()).toBeVisible({ timeout: 5000 });
    // Save label should appear
    await expect(sharedPage.getByText('1 Month Free', { exact: true }).first()).toBeVisible();

    // Switch back to Monthly
    await clickByText(sharedPage, 'Monthly');
    await sharedPage.waitForTimeout(500);
    await expect(sharedPage.getByText('R299').first()).toBeVisible({ timeout: 5000 });
  });

  test('Plan cards have Choose buttons that are clickable', async () => {
    await navigateToSubscriptionPlans(sharedPage);

    // The "Choose Free" button on Basic Package
    const chooseFreeBtn = sharedPage.getByText('Choose Free', { exact: true }).first();
    await expect(chooseFreeBtn).toBeVisible({ timeout: 10000 });

    // The "Choose" button on Premium (not "Choose Free")
    const chooseBtn = sharedPage.getByText('Choose', { exact: true }).nth(1);
    await expect(chooseBtn).toBeVisible();

    // Click Choose Free — should navigate to application form or show existing app message
    await chooseFreeBtn.click({ force: true });
    await sharedPage.waitForTimeout(3000);

    // Should navigate away from the plans screen or show a dialog
    const stillOnPlans = await sharedPage.getByText('Vendor & Service Plans', { exact: true }).first().isVisible().catch(() => false);
    const hasDialog = await sharedPage.getByText(/existing|already|application|portfolio/i).first().isVisible().catch(() => false);
    expect(stillOnPlans === false || hasDialog).toBe(true);
  });

  test('Full Feature Comparison table is visible on desktop', async () => {
    await navigateToSubscriptionPlans(sharedPage);

    // Scroll to feature comparison
    await sharedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sharedPage.waitForTimeout(500);

    await expect(sharedPage.getByText('Full Feature Comparison', { exact: true })).toBeVisible({ timeout: 10000 });

    // Feature table should have Feature column header
    await expect(sharedPage.getByText('Feature', { exact: true }).first()).toBeVisible();

    // Some feature labels should be visible
    await expect(sharedPage.getByText('Photo Uploads', { exact: true }).first()).toBeVisible();
    await expect(sharedPage.getByText('Online quote requests', { exact: true }).first()).toBeVisible();
    await expect(sharedPage.getByText('Featured Listings', { exact: true }).first()).toBeVisible();
  });

  test('Back button on plans screen navigates back', async () => {
    await navigateToSubscriptionPlans(sharedPage);

    // Click Back button
    const backBtn = sharedPage.getByText('Back', { exact: true }).first();
    await expect(backBtn).toBeVisible({ timeout: 5000 });
    await backBtn.click({ force: true });
    await sharedPage.waitForTimeout(1000);

    // Should no longer be on plans screen
    const stillOnPlans = await sharedPage.getByText('Vendor & Service Plans', { exact: true }).first().isVisible().catch(() => false);
    expect(stillOnPlans).toBe(false);
  });

  test('Venue listing plans screen shows annual/6-month plans', async () => {
    await navigateToVenuePlans(sharedPage);

    // The venue plans screen should show monthly, 6-month, 12-month options
    const venuePlansVisible = await sharedPage.getByText(/6.*month|12.*month|annual|yearly/i).first().isVisible().catch(() => false);

    if (venuePlansVisible) {
      await expect(sharedPage.getByText(/6.*month|12.*month|annual/i).first()).toBeVisible({ timeout: 10000 });
    } else {
      // Navigate through the form to reach step 4 where plans appear
      const venueNameInput = sharedPage.getByPlaceholder(/venue.*name|listing.*name|business.*name/i).first();
      if (await venueNameInput.isVisible().catch(() => false)) {
        await venueNameInput.fill('E2E Desktop Test Venue');
      }

      const nextBtn = sharedPage.getByText('Next', { exact: true }).first();
      while (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click({ force: true });
        await sharedPage.waitForTimeout(1000);
        const planText = sharedPage.getByText(/6.*month|12.*month|monthly|annual/i).first();
        if (await planText.isVisible().catch(() => false)) {
          await expect(planText).toBeVisible({ timeout: 5000 });
          break;
        }
      }
    }
  });

  test('Can navigate to vendor application form from plan selection', async () => {
    await navigateToSubscriptionPlans(sharedPage);

    // Click "Choose" on Premium plan (not free)
    const chooseBtn = sharedPage.getByText('Choose', { exact: true }).nth(1);
    await expect(chooseBtn).toBeVisible({ timeout: 10000 });
    await chooseBtn.click({ force: true });
    await sharedPage.waitForTimeout(3000);

    // Should navigate to either application form, checkout, or show existing app message
    const onApplicationForm = await sharedPage.getByText(/Company Details|Application|Page \d of \d/i).first().isVisible().catch(() => false);
    const onCheckout = await sharedPage.getByText(/Checkout|Subscription Checkout/i).first().isVisible().catch(() => false);
    const onExistingApp = await sharedPage.getByText(/Existing application|blocking|already/i).first().isVisible().catch(() => false);
    const onCreatePortfolio = await sharedPage.getByText(/Create Portfolio|Select your portfolio/i).first().isVisible().catch(() => false);

    expect(onApplicationForm || onCheckout || onExistingApp || onCreatePortfolio).toBe(true);
  });
});
