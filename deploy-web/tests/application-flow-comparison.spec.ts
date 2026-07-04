import { test, expect } from '@playwright/test';
import { gotoPage, signIn, getAuthUser, supabase } from './helpers';

test.describe('Application Flow Simulation - Vendor & Venue', () => {
  test.beforeAll(async () => {
    const user = await getAuthUser();
    await supabase.from('subscriber_applications').delete().eq('user_id', user.id);
    await supabase.auth.signOut();
  });

  test('simulate vendor application flow through all 4 steps', async ({ page }) => {
    await signIn(page);
    await gotoPage(page, '/portfolio-type');

    await expect(page.getByText('Choose Portfolio Type')).toBeVisible();
    await page.getByRole('button', { name: /Vendor/ }).click();
    await page.waitForURL('**/apply/step1', { timeout: 10000 });

    await expect(page.getByText('Step 1: Company Details')).toBeVisible();
    await page.getByPlaceholder('Registered business name').fill('Test Vendor Business');
    await page.getByPlaceholder('Owner\'s full name').fill('Test Owner');
    await page.getByPlaceholder('business@email.com', { exact: false }).first().fill('vendor@test.com');
    await page.getByPlaceholder('Contact phone number').fill('0821234567');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL('**/apply/step2', { timeout: 10000 });

    await expect(page.getByText('Step 2: Service Details')).toBeVisible();
    await page.getByRole('button', { name: 'Photography' }).click();
    await page.getByRole('button', { name: 'Catering' }).click();
    await page.getByRole('button', { name: 'Gauteng' }).click();
    await page.getByPlaceholder('Tell us about your business').fill('A'.repeat(50));
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL('**/apply/step3', { timeout: 10000 });

    await expect(page.getByText('Step 3: Portfolio Media')).toBeVisible();
    await page.getByRole('button', { name: 'Upload ID Copy' }).isVisible();
    await page.getByRole('button', { name: 'Upload Company Logo' }).isVisible();
  });

  test('simulate venue application flow through all 4 steps', async ({ page }) => {
    const user = await getAuthUser();
    await supabase.from('subscriber_applications').delete().eq('user_id', user.id);
    await supabase.auth.signOut();

    await signIn(page);
    await gotoPage(page, '/portfolio-type');

    await expect(page.getByText('Choose Portfolio Type')).toBeVisible();
    await page.getByRole('button', { name: /Venue/ }).first().click();
    await page.waitForURL('**/apply/step1', { timeout: 10000 });

    await expect(page.getByText('Step 1: Company Details')).toBeVisible();
    await page.getByPlaceholder('Registered business name').fill('Test Venue Business');
    await page.getByPlaceholder('Owner\'s full name').fill('Test Venue Owner');
    await page.getByPlaceholder('business@email.com', { exact: false }).first().fill('venue@test.com');
    await page.getByPlaceholder('Contact phone number').fill('0821234567');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL('**/apply/step2', { timeout: 10000 });

    await expect(page.getByText('Step 2: Venue Details')).toBeVisible();
    await page.getByRole('button', { name: 'Hotel' }).click();
    await page.getByPlaceholder('Max guest capacity').fill('200');
    await page.getByRole('button', { name: 'Wedding' }).click();
    await page.getByRole('button', { name: 'Gauteng' }).click();
    await page.getByPlaceholder('Tell us about your business').fill('A'.repeat(50));
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL('**/apply/step3', { timeout: 10000 });

    await expect(page.getByText('Step 3: Portfolio Media')).toBeVisible();
  });
});
