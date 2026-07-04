import { test, expect } from '@playwright/test';
import { signIn, gotoPage } from './helpers';

test.describe('Listers portal and portfolio management smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('Listers Portal page matches mobile structure', async ({ page }, testInfo) => {
    await gotoPage(page, '/listers-portal');
    await expect(page.getByRole('heading', { name: 'Welcome to Funxon' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ABOUT' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register your venue portfolio now!' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register your vendor/services now!' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reviews & Ratings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Listers Blog' })).toBeVisible();
    await page.screenshot({
      path: `test-results/listers-portal-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('Lister Portfolio page loads portfolio management', async ({ page }, testInfo) => {
    await gotoPage(page, '/lister-portfolio');
    await expect(page.getByText(/Welcome back/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Portfolio' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Profile & Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Listers Blog' })).toBeVisible();
    await page.screenshot({
      path: `test-results/lister-portfolio-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });
});
