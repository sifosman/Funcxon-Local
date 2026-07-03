// WEB ONLY — deploy-web/tests/planner.spec.ts
import { expect, test, type Page } from '@playwright/test';
import { signIn, gotoPage } from './helpers';

async function clearPlannerStorage(page: Page) {
  await page.evaluate(() => {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('funxon.planner.')) localStorage.removeItem(key);
      }
    } catch {}
  });
}

test.describe('Planner Tests', () => {
  test('visit /planner (signed in) → planner loads', async ({ page }) => {
    await signIn(page);
    await gotoPage(page, '/planner');

    await expect(page.getByText('Event Planner', { exact: true })).toBeVisible({ timeout: 5000 });

    // Budget summary cards should be visible
    await expect(page.getByText('Total Allocated')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();
  });

  test('add a budget item → appears in list, total updates', async ({ page }) => {
    await signIn(page);
    await clearPlannerStorage(page);
    await gotoPage(page, '/planner');

    // Click "Add Budget Item"
    await page.getByRole('button', { name: 'Add Budget Item' }).click();

    // Fill the new item form
    const itemName = `Test Item ${Date.now()}`;
    await page.getByPlaceholder('Item name').fill(itemName);
    await page.getByPlaceholder('Budget (R)').fill('5000');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(page.getByText(itemName, { exact: true })).toBeVisible({ timeout: 5000 });
    // Total Allocated should reflect the new item
    await expect(page.locator('text=/R5,000/').first()).toBeVisible({ timeout: 5000 });
  });

  test('delete budget item → removed from list', async ({ page }) => {
    await signIn(page);
    await clearPlannerStorage(page);
    await gotoPage(page, '/planner');

    // Add a budget item so there is something to delete
    await page.getByRole('button', { name: 'Add Budget Item' }).click();
    const itemName = `Delete Item ${Date.now()}`;
    await page.getByPlaceholder('Item name').fill(itemName);
    await page.getByPlaceholder('Budget (R)').fill('1000');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(itemName, { exact: true })).toBeVisible({ timeout: 5000 });

    // Click the delete button for the item
    const deleteButtons = page.locator('button:has(svg.lucide-trash2)');
    await expect(deleteButtons.first()).toBeVisible({ timeout: 5000 });
    await deleteButtons.first().click();

    await expect(page.getByText(itemName, { exact: true })).not.toBeVisible({ timeout: 5000 });
  });

  test('planner shows empty state when no items', async ({ page }) => {
    await signIn(page);
    await clearPlannerStorage(page);
    await gotoPage(page, '/planner');

    // Should show empty state on the budget tab
    await expect(page.getByText('No budget items yet.')).toBeVisible({ timeout: 10_000 });
  });
});
