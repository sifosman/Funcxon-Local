import { expect, type Page } from '@playwright/test';

export async function gotoApp(page: Page, path = '/') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await dismissConsentIfPresent(page);
}

export async function dismissConsentIfPresent(page: Page) {
  const acceptButton = page.getByText('Accept & Continue', { exact: true });
  if (await acceptButton.isVisible().catch(() => false)) {
    await page.getByText('Essential Data Processing', { exact: true }).click();
    await expect(acceptButton).toBeEnabled();
    await acceptButton.click();
  }
}

export async function openAccountTab(page: Page) {
  const accountTab = page.getByRole('button', { name: 'Account' }).last();
  await expect(accountTab).toBeVisible();
  await accountTab.click();
}

export async function openAccountMenuItem(page: Page, label: string) {
  const item = page.getByText(label, { exact: true }).first();
  await expect(item).toBeVisible();
  await item.click();
}

export async function goToWelcomeFromHomeSearch(page: Page) {
  await gotoApp(page);

  const searchButton = page.getByRole('button', { name: 'Search' }).first();
  await expect(searchButton).toBeVisible();
  await searchButton.click();

  await expect(page.getByText('Welcome to Funcxon', { exact: true })).toBeVisible();
}

export async function loginFromWelcome(page: Page) {
  const username = process.env.PW_E2E_USERNAME;
  const password = process.env.PW_E2E_PASSWORD;

  if (!username || !password) {
    throw new Error('PW_E2E_USERNAME and PW_E2E_PASSWORD must be set to run authenticated Playwright tests.');
  }

  await page.getByText('Log in', { exact: true }).first().click();
  await expect(page.getByText('Welcome Back', { exact: true })).toBeVisible();

  await page.getByPlaceholder('Email').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByText('Log in', { exact: true }).last().click();

  await expect(page.getByText('Account', { exact: true }).last()).toBeVisible({ timeout: 30000 });
}
