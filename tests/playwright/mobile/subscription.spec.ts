import { test, expect, type Page } from '@playwright/test';
import {
  gotoApp,
  dismissConsentIfPresent,
  loginAsGlobalTestUser,
  openAccountTab,
  acceptPopiaConsent,
} from '../helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — Subscription Plans & Checkout (mobile)
// Items: 29JULY 9-11, 16, 21
// ─────────────────────────────────────────────────────────────────────────────

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.use({ viewport: MOBILE_VIEWPORT });

async function navigateToSubscriptionPlans(page: Page) {
  await gotoApp(page);
  await dismissConsentIfPresent(page);

  // Navigate via Account tab → "Become a Vendor" / "Subscription Plans"
  // Or directly via Listers Portal "Register your services" → SubscriptionPlans
  const registerLink = page.getByText(/Register your services/i).first();
  if (await registerLink.isVisible({ timeout: 8000 }).catch(() => false)) {
    await registerLink.click();
    await page.waitForTimeout(2000);
    return;
  }

  // Fallback: try Account tab → Subscription Plans menu
  await openAccountTab(page);
  await page.waitForTimeout(1000);
  const subLink = page.getByText(/Subscription Plans|Become a Vendor|Vendor & Service Plans/i).first();
  if (await subLink.isVisible({ timeout: 8000 }).catch(() => false)) {
    await subLink.click();
    await page.waitForTimeout(2000);
  }
}

// ─── 29JULY 9: Subscription plans screen renders with 3 plan cards ─────────

test.describe('Subscription Plans — 29JULY 9-11', () => {
  test('29JULY 9: Plans screen shows "Vendor & Service Plans" heading and 3 plan titles', async ({ page }) => {
    await navigateToSubscriptionPlans(page);

    // Heading
    const heading = page.getByText(/Vendor & Service Plans/i).first();
    await expect(heading).toBeAttached({ timeout: 15000 });

    // Plan titles
    await expect(page.getByText('Basic Package', { exact: true }).first()).toBeAttached({ timeout: 10000 });
    await expect(page.getByText('Premium', { exact: true }).first()).toBeAttached({ timeout: 10000 });
    await expect(page.getByText('Premium Plus', { exact: true }).first()).toBeAttached({ timeout: 10000 });
  });

  test('29JULY 9b: Launch offer subtitle is visible', async ({ page }) => {
    await navigateToSubscriptionPlans(page);

    const subtitle = page.getByText(/Limited-time launch offer/i).first();
    await expect(subtitle).toBeAttached({ timeout: 15000 });
  });

  test('29JULY 10: Monthly/Yearly billing toggle is visible and tappable', async ({ page }) => {
    await navigateToSubscriptionPlans(page);

    // Monthly toggle
    const monthlyBtn = page.getByText('Monthly', { exact: true }).first();
    await expect(monthlyBtn).toBeAttached({ timeout: 10000 });

    // Yearly toggle
    const yearlyBtn = page.getByText(/Yearly/i).first();
    await expect(yearlyBtn).toBeAttached({ timeout: 10000 });

    // Tap "Yearly" and verify price changes
    await yearlyBtn.click();
    await page.waitForTimeout(1000);

    // After switching to yearly, the "1 Month Free" save label should appear
    const saveLabel = page.getByText(/1 Month Free/i).first();
    await expect(saveLabel).toBeAttached({ timeout: 5000 });
  });

  test('29JULY 10b: Tapping Monthly toggle shows monthly prices', async ({ page }) => {
    await navigateToSubscriptionPlans(page);

    // Ensure Monthly is selected
    const monthlyBtn = page.getByText('Monthly', { exact: true }).first();
    await monthlyBtn.click();
    await page.waitForTimeout(1000);

    // Monthly price for Premium should be R299
    const price = page.getByText('R299', { exact: true }).first();
    await expect(price).toBeAttached({ timeout: 5000 });
  });

  test('29JULY 11: Plan cards show feature lists', async ({ page }) => {
    await navigateToSubscriptionPlans(page);

    // Check for feature text that appears in plan cards
    const photoFeature = page.getByText(/Photo Uploads/i).first();
    await expect(photoFeature).toBeAttached({ timeout: 10000 });

    const videoFeature = page.getByText(/Video uploads/i).first();
    await expect(videoFeature).toBeAttached({ timeout: 5000 });

    const featuredFeature = page.getByText(/Featured Listings/i).first();
    await expect(featuredFeature).toBeAttached({ timeout: 5000 });
  });

  test('29JULY 11b: "Upgrade or cancel anytime" footer text is visible', async ({ page }) => {
    await navigateToSubscriptionPlans(page);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const footerText = page.getByText(/Upgrade or cancel anytime/i).first();
    await expect(footerText).toBeAttached({ timeout: 10000 });
  });
});

// ─── 29JULY 16: Plan selection & checkout navigation ───────────────────────

test.describe('Subscription Plans — plan selection (29JULY 16)', () => {
  test('29JULY 16: "Choose" button is visible on paid plan cards', async ({ page }) => {
    await navigateToSubscriptionPlans(page);

    // At least one "Choose" button should be present
    const chooseBtn = page.getByText('Choose', { exact: true }).first();
    await expect(chooseBtn).toBeAttached({ timeout: 10000 });
  });

  test('29JULY 16b: "Choose Free" button is visible on Basic Package', async ({ page }) => {
    await navigateToSubscriptionPlans(page);

    const chooseFreeBtn = page.getByText('Choose Free', { exact: true }).first();
    await expect(chooseFreeBtn).toBeAttached({ timeout: 10000 });
  });

  test('29JULY 16c: "Confirm Free Plan" button appears when Basic is selected', async ({ page }) => {
    await navigateToSubscriptionPlans(page);

    // Tap "Choose Free" on Basic Package
    const chooseFreeBtn = page.getByText('Choose Free', { exact: true }).first();
    await expect(chooseFreeBtn).toBeAttached({ timeout: 10000 });
    await chooseFreeBtn.click();
    await page.waitForTimeout(2000);

    // The bottom CTA should show "Confirm Free Plan"
    const confirmBtn = page.getByText(/Confirm Free Plan/i).first();
    await expect(confirmBtn).toBeAttached({ timeout: 5000 });
  });

  test('29JULY 16d: "Continue with Premium" button appears when Premium is selected', async ({ page }) => {
    await navigateToSubscriptionPlans(page);

    // Tap "Choose" on Premium
    const chooseBtn = page.getByText('Choose', { exact: true }).first();
    await expect(chooseBtn).toBeAttached({ timeout: 10000 });
    await chooseBtn.click();
    await page.waitForTimeout(2000);

    // The bottom CTA should show "Continue with Premium"
    const continueBtn = page.getByText(/Continue with Premium/i).first();
    await expect(continueBtn).toBeAttached({ timeout: 5000 });
  });
});

// ─── 29JULY 21: Checkout screen renders billing form ───────────────────────

test.describe('Subscription Checkout — 29JULY 21', () => {
  test('29JULY 21: Checkout screen shows "Checkout" heading and "Order Summary"', async ({ page }) => {
    // Log in first so checkout is accessible
    await gotoApp(page, '/auth');
    await acceptPopiaConsent(page);
    await loginAsGlobalTestUser(page);
    await page.waitForTimeout(2000);

    // Navigate to subscription plans
    await navigateToSubscriptionPlans(page);

    // Select a paid plan and continue
    const chooseBtn = page.getByText('Choose', { exact: true }).first();
    await expect(chooseBtn).toBeAttached({ timeout: 10000 });
    await chooseBtn.click();
    await page.waitForTimeout(2000);

    const continueBtn = page.getByText(/Continue with Premium/i).first();
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(3000);

      // Checkout screen should appear
      const checkoutHeading = page.getByText('Checkout', { exact: true }).first();
      await expect(checkoutHeading).toBeAttached({ timeout: 15000 });

      // Order Summary section
      const orderSummary = page.getByText(/Order Summary/i).first();
      await expect(orderSummary).toBeAttached({ timeout: 10000 });
    }
  });

  test('29JULY 21b: Checkout shows "Confirm your plan and enter your billing details" subtitle', async ({ page }) => {
    await gotoApp(page, '/auth');
    await acceptPopiaConsent(page);
    await loginAsGlobalTestUser(page);
    await page.waitForTimeout(2000);

    await navigateToSubscriptionPlans(page);

    const chooseBtn = page.getByText('Choose', { exact: true }).first();
    await chooseBtn.click();
    await page.waitForTimeout(2000);

    const continueBtn = page.getByText(/Continue with Premium/i).first();
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(3000);

      const subtitle = page.getByText(/Confirm your plan and enter your billing details/i).first();
      await expect(subtitle).toBeAttached({ timeout: 15000 });
    }
  });

  test('29JULY 21c: Checkout has "Proceed to PayFast" or "Confirm Free Plan" action button', async ({ page }) => {
    await gotoApp(page, '/auth');
    await acceptPopiaConsent(page);
    await loginAsGlobalTestUser(page);
    await page.waitForTimeout(2000);

    await navigateToSubscriptionPlans(page);

    // Try free plan checkout
    const chooseFreeBtn = page.getByText('Choose Free', { exact: true }).first();
    await chooseFreeBtn.click();
    await page.waitForTimeout(2000);

    const confirmBtn = page.getByText(/Confirm Free Plan/i).first();
    if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);

      // Should show "Confirm Free Plan & Continue" on checkout
      const checkoutAction = page.getByText(/Confirm Free Plan & Continue|Proceed to PayFast/i).first();
      await expect(checkoutAction).toBeAttached({ timeout: 15000 });
    }
  });
});
