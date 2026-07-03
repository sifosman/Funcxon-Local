import { expect, test } from '@playwright/test';
import * as path from 'path';
import {
  cleanupMockAssets,
  cleanupUserApplications,
  createMockAssets,
  goToWelcomeFromHomeSearch,
  loginFromWelcome,
  MOCK_ASSETS_DIR,
  openAccountMenuItem,
  openAccountTab,
  supabase,
} from './helpers';

test.describe('Subscriber "Become a Vendor" Application E2E Flow', () => {
  const username = process.env.PW_E2E_USERNAME || 'mohamed@owdsolutions.co.za';
  const password = process.env.PW_E2E_PASSWORD || 'Thierry14247!';

  test.beforeAll(async () => {
    // 1. Setup mock assets dynamically
    createMockAssets();

    // 2. Clear pre-existing applications from database so the account starts from clean state
    await cleanupUserApplications(username, password);
  });

  test.afterAll(async () => {
    // Cleanup files
    cleanupMockAssets();
  });

  test('should successfully complete the 4-step registration and persist to backend DB', async ({ page }) => {
    // 1. Welcome & Login
    await goToWelcomeFromHomeSearch(page);
    await loginFromWelcome(page);

    // 2. Navigate to "Become a Vendor" from Account menu
    await openAccountTab(page);
    await openAccountMenuItem(page, 'Become a Vendor');

    // Assert Portfolio selection screen
    await expect(page.getByText('Create Portfolio', { exact: true })).toBeVisible();
    await page.getByText('Vendors / Service Professionals', { exact: true }).click();

    // 3. Step 1: Company Details
    await expect(page.getByText('Company Details', { exact: true })).toBeVisible();
    
    // Fill all mandatory fields
    await page.getByPlaceholder('Enter your registered business name').fill('OWD Solutions E2E Test Vendor');
    await page.getByPlaceholder('Enter your trading name').fill('OWD Solutions');
    await page.getByPlaceholder('Enter owner\'s full name').fill('Mohamed E2E Tester');
    await page.getByPlaceholder('Enter company registration or ID number').fill('REG-2026-999999');
    await page.getByPlaceholder('Enter VAT number').fill('VAT-999888777');
    await page.getByPlaceholder('Enter physical business address').fill('123 Innovation Way, Tech Park');
    await page.getByPlaceholder('Enter billing address').fill('123 Innovation Way, Tech Park');
    await page.getByPlaceholder('Enter contact phone').fill('+27812345678');
    await page.getByPlaceholder('Enter alternate phone').fill('+27812345679');
    await page.getByPlaceholder('Enter email address').fill('mohamed.e2e@owdsolutions.co.za');
    await page.getByPlaceholder('Enter alternate email').fill('mohamed.alt@owdsolutions.co.za');
    
    // Fill social media handles
    await page.getByPlaceholder('@yourhandle').first().fill('@owdsolutions_insta');
    await page.getByPlaceholder('Facebook page or profile URL').fill('https://facebook.com/owdsolutions');
    await page.getByPlaceholder('@yourhandle').last().fill('@owdsolutions_tiktok');

    // Click Next
    await page.getByText('Next', { exact: true }).click();

    // 4. Step 2: Service Category & Coverage
    await expect(page.getByText('Page 2 of 4', { exact: true })).toBeVisible();

    // Click service category card/checkbox (e.g. Catering, Decor, Photography, etc.)
    // We click the first category available in the UI
    const firstCategory = page.locator('text=/Catering|Decor|Photography|Entertainment|Hair & Makeup|Sound & Lighting/i').first();
    await expect(firstCategory).toBeVisible();
    await firstCategory.click();

    // Wait a brief moment for subcategories list to render, then select a subcategory
    const firstSubcategory = page.locator('text=/Corporate|Wedding|Party|Cocktail/i').first();
    if (await firstSubcategory.isVisible().catch(() => false)) {
      await firstSubcategory.click();
    }

    // Select Coverage Province (e.g. Gauteng, Western Cape, KwaZulu-Natal)
    const gautengProvince = page.getByText('Gauteng', { exact: true });
    await expect(gautengProvince).toBeVisible();
    await gautengProvince.click();

    // Wait for cities checklist, click a city (e.g. Johannesburg, Pretoria)
    const jhbCity = page.getByText('Johannesburg', { exact: true }).first();
    if (await jhbCity.isVisible().catch(() => false)) {
      await jhbCity.click();
    }

    // Fill business description text input
    await page.getByPlaceholder(/Describe your business/i).fill('We are a premium professional vendor offering top-tier services for high-end events across South Africa.');

    // Click Next
    await page.getByText('Next', { exact: true }).click();

    // 5. Step 3: Documents & Media (File Uploads)
    await expect(page.getByText('Page 3 of 4', { exact: true })).toBeVisible();

    // A. Portfolio Image Upload (dashed area)
    const imageUploadPromise = page.waitForEvent('filechooser');
    await page.getByText('Upload Images', { exact: true }).click();
    const imageChooser = await imageUploadPromise;
    await imageChooser.setFiles(path.join(MOCK_ASSETS_DIR, 'mock-image.png'));
    await expect(page.getByText(/added successfully|mock-image/i).first()).toBeVisible({ timeout: 15000 });

    // B. Video Upload (optional)
    const videoUploadPromise = page.waitForEvent('filechooser');
    await page.getByText('Upload Videos', { exact: true }).click();
    const videoChooser = await videoUploadPromise;
    await videoChooser.setFiles(path.join(MOCK_ASSETS_DIR, 'mock-video.mp4'));
    await expect(page.getByText(/added successfully|mock-video/i).first()).toBeVisible({ timeout: 15000 });

    // Click Next
    await page.getByText('Next', { exact: true }).click();

    // 6. Step 4: Subscription & Legal
    await expect(page.getByText('Page 4 of 4', { exact: true })).toBeVisible();

    // Select Subscription Package - Select the Free/Get Started plan card
    const freePlanCard = page.locator('text=/Free|Get Started/i').first();
    await expect(freePlanCard).toBeVisible();
    await freePlanCard.click();

    // Agree to Terms & Conditions and Privacy checkboxes
    const termsCheckbox = page.getByText('I accept the Terms and Conditions', { exact: false });
    await expect(termsCheckbox).toBeVisible();
    await termsCheckbox.click();

    const privacyCheckbox = page.getByText('I accept the Privacy Policy', { exact: false });
    await expect(privacyCheckbox).toBeVisible();
    await privacyCheckbox.click();

    // Click Submit Application
    const submitBtn = page.getByText('Submit Application', { exact: true });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Wait for submission process to complete and redirect user to their newly created Vendor Portfolio dashboard
    await expect(page.getByText(/Update Vendor Portfolio|Vendor Dashboard/i)).toBeVisible({ timeout: 30000 });
    console.log('[E2E Test] Registration form submitted successfully and redirected!');

    // 7. BACKEND DB Persisted Data Assertion
    // Query Supabase directly to assert the application is created properly and matches frontend input
    const cleanEmail = username.replace(',', '.');
    const commaEmail = username.includes(',') ? username : username.replace('.', ',');

    // Find the user ID first
    let dbUser;
    const { data: authDataDot } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (authDataDot.user) {
      dbUser = authDataDot.user;
    } else {
      const { data: authDataComma } = await supabase.auth.signInWithPassword({ email: commaEmail, password });
      dbUser = authDataComma.user;
    }

    expect(dbUser).toBeDefined();
    if (dbUser) {
      const { data: application, error } = await supabase
        .from('subscriber_applications')
        .select('*')
        .eq('user_id', dbUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      expect(error).toBeNull();
      expect(application).not.toBeNull();
      expect(application.portfolio_type).toBe('vendor');
      expect(application.company_details.registeredBusinessName).toBe('OWD Solutions E2E Test Vendor');
      expect(application.company_details.ownersName).toBe('Mohamed E2E Tester');
      expect(application.company_details.contactPhoneNumber).toBe('+27812345678');
      
      console.log('[Backend DB Assertion] Successfully verified persisted subscriber details in database!');
    }
  });
});
