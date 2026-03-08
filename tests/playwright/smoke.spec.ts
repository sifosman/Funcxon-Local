import { expect, test } from '@playwright/test';
import { goToWelcomeFromHomeSearch, loginFromWelcome, openAccountMenuItem, openAccountTab } from './helpers';

test.describe('Funcxon web smoke', () => {
  test('unauthenticated users are routed from home search to welcome', async ({ page }) => {
    await goToWelcomeFromHomeSearch(page);

    await expect(page.getByText('Log in', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Get started', { exact: true })).toBeVisible();
  });

  test('authenticated users can open help centre from my account', async ({ page }) => {
    await goToWelcomeFromHomeSearch(page);
    await loginFromWelcome(page);

    await openAccountTab(page);
    await openAccountMenuItem(page, 'Help Centre');

    await expect(page.getByText('Need help?', { exact: true })).toBeVisible();
    await expect(page.getByText('Contact Support', { exact: true })).toBeVisible();
    await expect(page.getByText('Request a manager (coming soon)', { exact: true })).toBeVisible();
  });

  test('authenticated users can reach the account vendor flow entry points', async ({ page }) => {
    await goToWelcomeFromHomeSearch(page);
    await loginFromWelcome(page);

    await openAccountTab(page);
    await openAccountMenuItem(page, 'My Profile');
    await openAccountMenuItem(page, 'Become a Vendor');

    await expect(page.getByText(/Subscription Plans|Select your portfolio type/i)).toBeVisible();
  });
});
