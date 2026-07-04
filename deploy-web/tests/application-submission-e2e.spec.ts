import { test, expect } from '@playwright/test';
import { gotoPage, signIn, getAuthUser, supabase } from './helpers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createTempFile(name: string, content: string | Buffer) {
  const filePath = path.join(__dirname, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

const minimalPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const minimalMp4Buffer = Buffer.from('ftypmp42', 'binary');

test.describe('Application Submission E2E', () => {
  test('submit vendor application and verify pending status', async ({ page }) => {
    const user = await getAuthUser();
    await supabase.from('subscriber_applications').delete().eq('user_id', user.id);

    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
    await signIn(page);
    await gotoPage(page, '/portfolio-type');
    await page.getByRole('button', { name: /Vendor/ }).click();
    await page.waitForURL('**/apply/step1', { timeout: 10000 });

    await page.getByPlaceholder('Registered business name').fill('E2E Vendor Co');
    await page.getByPlaceholder('Owner\'s full name').fill('E2E Owner');
    await page.getByPlaceholder('business@email.com', { exact: false }).first().fill('vendor@e2e.com');
    await page.getByPlaceholder('Contact phone number').fill('0821234567');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL('**/apply/step2', { timeout: 10000 });

    await page.getByRole('button', { name: 'Photography' }).click();
    await page.getByRole('button', { name: 'Gauteng' }).click();
    await page.getByPlaceholder('Tell us about your business').fill('A professional photography service for all events. '.repeat(2));
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL('**/apply/step3', { timeout: 10000 });

    const portfolioImage = createTempFile('vendor-portfolio.png', minimalPngBuffer);
    const portfolioVideo = createTempFile('vendor-portfolio.mp4', minimalMp4Buffer);

    await page.locator('#image-upload').setInputFiles(portfolioImage);
    await page.waitForTimeout(3000);
    await page.locator('#video-upload').setInputFiles(portfolioVideo);
    await page.waitForTimeout(3000);

    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL('**/apply/step4', { timeout: 10000 });

    await page.getByRole('button', { name: /Get Started|Free/i }).first().click();
    await page.getByRole('checkbox', { name: /Terms and Conditions/i }).check();
    await page.getByRole('checkbox', { name: /Privacy Policy/i }).check();

    await page.getByRole('button', { name: /Submit Application/i }).click();
    await page.waitForURL('**/apply/success', { timeout: 15000 });

    const { data: apps } = await supabase
      .from('subscriber_applications')
      .select('status, portfolio_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    expect(apps?.length).toBeGreaterThan(0);
    expect(apps?.[0].status).toBe('pending');
    expect(apps?.[0].portfolio_type).toBe('vendor');

    fs.unlinkSync(portfolioImage);
    fs.unlinkSync(portfolioVideo);
  });

  test('submit venue application and verify pending status', async ({ page }) => {
    const user = await getAuthUser();
    await supabase.from('subscriber_applications').delete().eq('user_id', user.id);

    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
    await signIn(page);
    await gotoPage(page, '/portfolio-type');
    await page.getByRole('button', { name: /Venue/ }).first().click();
    await page.waitForURL('**/apply/step1', { timeout: 10000 });

    await page.getByPlaceholder('Registered business name').fill('E2E Venue Co');
    await page.getByPlaceholder('Owner\'s full name').fill('E2E Venue Owner');
    await page.getByPlaceholder('business@email.com', { exact: false }).first().fill('venue@e2e.com');
    await page.getByPlaceholder('Contact phone number').fill('0821234567');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL('**/apply/step2', { timeout: 10000 });

    await page.getByRole('button', { name: 'Hotel' }).click();
    await page.getByPlaceholder('Max guest capacity').fill('150');
    await page.getByRole('button', { name: 'Wedding' }).click();
    await page.getByRole('button', { name: 'Gauteng' }).click();
    await page.getByPlaceholder('Tell us about your business').fill('A beautiful venue for weddings and events. '.repeat(2));
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL('**/apply/step3', { timeout: 10000 });

    const portfolioImage = createTempFile('venue-portfolio.png', minimalPngBuffer);
    const portfolioVideo = createTempFile('venue-portfolio.mp4', minimalMp4Buffer);

    await page.locator('#image-upload').setInputFiles(portfolioImage);
    await page.waitForTimeout(3000);
    await page.locator('#video-upload').setInputFiles(portfolioVideo);
    await page.waitForTimeout(3000);

    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForURL('**/apply/step4', { timeout: 10000 });

    await page.getByRole('button', { name: /Get Started|Free/i }).first().click();
    await page.getByRole('checkbox', { name: /Terms and Conditions/i }).check();
    await page.getByRole('checkbox', { name: /Privacy Policy/i }).check();

    await page.getByRole('button', { name: /Submit Application/i }).click();
    await page.waitForURL('**/apply/success', { timeout: 15000 });

    const { data: apps } = await supabase
      .from('subscriber_applications')
      .select('status, portfolio_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    expect(apps?.length).toBeGreaterThan(0);
    expect(apps?.[0].status).toBe('pending');
    expect(apps?.[0].portfolio_type).toBe('venue');

    fs.unlinkSync(portfolioImage);
    fs.unlinkSync(portfolioVideo);
  });
});
