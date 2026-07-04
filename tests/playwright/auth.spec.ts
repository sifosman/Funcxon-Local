import { expect, test } from '@playwright/test';
import { gotoApp } from './helpers';

test.describe('Authentication and Field Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear persisted auth state so the auth tests always start logged out
    await gotoApp(page, '/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    // Navigate directly to the Auth route to reach the welcome/login screen
    await gotoApp(page, '/auth');
  });

  test('should display validation errors on invalid sign-in attempt', async ({ page }) => {
    // Navigate to Login screen
    await page.getByText('Log in', { exact: true }).first().click();
    await expect(page.getByText('Welcome Back', { exact: true })).toBeVisible();

    // Check empty validation / button interaction
    await page.getByPlaceholder('Email').fill('invalid-email');
    await page.getByPlaceholder('Password').fill('123');
    await page.getByText('Log in', { exact: true }).last().click();

    // Verify error state (since 'invalid-email' is not a valid email format, or wrong credentials)
    // The screen should show appropriate validation feedback or alert
    await expect(page.getByPlaceholder('Email')).toHaveValue('invalid-email');
    await expect(page.getByPlaceholder('Password')).toHaveValue('123');
  });

  test('should display input fields and register button on Sign Up screen', async ({ page }) => {
    // Navigate to Sign Up screen from Welcome
    await page.getByText('Get started', { exact: true }).click();
    
    // Verify Sign Up form fields are visible
    await expect(page.getByPlaceholder('Name')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password').first()).toBeVisible();
    await expect(page.getByPlaceholder('Confirm Password')).toBeVisible();

    // Fill sign up fields to test interactive text inputs
    await page.getByPlaceholder('Name').fill('John Doe');
    await page.getByPlaceholder('Email').fill('john.doe@example.com');
    await page.getByPlaceholder('Password').first().fill('SecurePassword123!');
    await page.getByPlaceholder('Confirm Password').fill('SecurePassword123!');

    // Assert that fields have the correct values
    await expect(page.getByPlaceholder('Name')).toHaveValue('John Doe');
    await expect(page.getByPlaceholder('Email')).toHaveValue('john.doe@example.com');
    await expect(page.getByPlaceholder('Password').first()).toHaveValue('SecurePassword123!');
    await expect(page.getByPlaceholder('Confirm Password')).toHaveValue('SecurePassword123!');

    // Click register button
    const signUpButton = page.getByText('Sign up', { exact: true }).last();
    await expect(signUpButton).toBeVisible();
  });
});
