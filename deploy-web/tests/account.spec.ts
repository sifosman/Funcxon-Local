// WEB ONLY — deploy-web/tests/account.spec.ts
import { expect, test } from '@playwright/test';
import { signIn, gotoPage } from './helpers';

test.describe('Account Tests', () => {
  test('/account (signed in) → username, role badge shown', async ({ page }) => {
    await signIn(page);

    // Should be on /account already from signIn
    await expect(page).toHaveURL(/\/account/);

    // Profile card with user info
    const profileCard = page.locator('.rounded-xl.bg-white').first();
    await expect(profileCard).toBeVisible({ timeout: 5000 });

    // Role badge (Attendee or Vendor) — use .first() to avoid strict mode violation from nav links
    await expect(page.getByText(/Attendee|Vendor/, { exact: true }).first()).toBeVisible();

    // Menu items
    await expect(page.getByText('Favourites', { exact: true })).toBeVisible();
    await expect(page.getByText('My Quotes', { exact: true })).toBeVisible();
    await expect(page.getByText('Event Planner', { exact: true })).toBeVisible();
  });

  test('/account/favourites → shortlist renders', async ({ page }) => {
    await signIn(page);
    await gotoPage(page, '/account/favourites');

    await expect(page.getByText('My Favourites', { exact: true })).toBeVisible({ timeout: 5000 });

    // Either loading, empty state, or favourites list
    const emptyState = page.getByText('No favourites yet');
    const loadingSkeleton = page.locator('.animate-pulse').first();
    const favCard = page.locator('.fx-card').first();

    await expect(emptyState.or(loadingSkeleton).or(favCard)).toBeVisible({ timeout: 10_000 });
  });

  test('account menu → Sign Out button present', async ({ page }) => {
    await signIn(page);

    const signOutBtn = page.getByText('Sign Out', { exact: true });
    await expect(signOutBtn).toBeVisible({ timeout: 5000 });
  });

  test('account menu links navigate correctly', async ({ page }) => {
    await signIn(page);

    // Click Favourites link
    const favLink = page.getByRole('link', { name: 'Favourites', exact: true });
    await favLink.click();
    await page.waitForURL('**/account/favourites', { timeout: 5000 });
    await expect(page).toHaveURL(/\/account\/favourites/);

    // Go back to account
    await page.goto('/account', { waitUntil: 'domcontentloaded' });

    // Click My Quotes
    const quotesLink = page.getByRole('link', { name: 'My Quotes', exact: true });
    await quotesLink.click();
    await page.waitForURL('**/quotes', { timeout: 5000 });
  });

  test('header shows Hi, username when logged in', async ({ page }) => {
    await signIn(page);
    await gotoPage(page, '/');

    // Header should show "Hi, ..." link (desktop view)
    const hiLink = page.getByRole('link', { name: /Hi,/ });
    await expect(hiLink.first()).toBeVisible({ timeout: 5000 });
  });
});
