import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FullConfig } from '@playwright/test';
import { chromium, expect } from '@playwright/test';

const USERNAME = 'mohamed@owdsolutions.co.za';
const PASSWORD = 'Thierry14247!';

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL as string | undefined;
  const storageStatePath = (config.projects[0]?.use?.storageState as string | undefined) ?? './tests/e2e/.auth/storageState.json';

  mkdirSync(dirname(storageStatePath), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(baseURL ?? 'http://localhost:8082');
  await page.waitForTimeout(3000);

  // Try to find and click login button, but don't fail if not found
  try {
    await expect(page.getByText('Welcome to Funcxon')).toBeVisible({ timeout: 10000 });
    await page.locator('div:visible', { hasText: /^Log in$/ }).first().click({ timeout: 5000 });
    
    await expect(page.getByText('Welcome Back')).toBeVisible({ timeout: 10000 });
    
    await page.getByPlaceholder('Email').fill(USERNAME);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.locator('div:visible', { hasText: /^Log in$/ }).first().click();
    
    await expect(page.getByText('Account', { exact: true })).toBeVisible({ timeout: 30000 });
  } catch (error) {
    console.log('Authentication setup failed, proceeding without auth:', error);
  }

  await page.context().storageState({ path: storageStatePath });
  await browser.close();
}
