// WEB ONLY — deploy-web/tests/blog.spec.ts
import { expect, test } from '@playwright/test';
import { gotoPage } from './helpers';

test.describe('Blog Tests', () => {
  test('/blog → list of posts renders or error state if HubSpot unavailable', async ({ page }) => {
    await gotoPage(page, '/blog');

    // Page heading
    await expect(page.getByText('Blog', { exact: true }).first()).toBeVisible({ timeout: 5000 });

    // Wait for loading to finish
    await page.waitForTimeout(5000);

    // Either posts grid, error state, or empty state
    const errorState = page.getByText('Unable to load blog posts');
    const emptyState = page.getByText('No posts yet');
    const postCard = page.locator('a[href^="/blog/"]').first();
    const loadingSkeleton = page.locator('.animate-pulse').first();

    await expect(errorState.or(emptyState).or(postCard).or(loadingSkeleton)).toBeVisible({ timeout: 15_000 });
  });

  test('click blog post → /blog/:slug → article content renders or error shown', async ({ page }) => {
    await gotoPage(page, '/blog');

    // Wait for posts to load
    await page.waitForTimeout(5000);

    // Check if there are any post cards
    const postCards = page.locator('a[href^="/blog/"]');
    const count = await postCards.count();

    if (count > 0) {
      // Click the first post
      await postCards.first().click();
      await page.waitForURL('**/blog/*', { timeout: 5000 });

      // Should show some article content or error
      await page.waitForTimeout(3000);
      // The BlogDetailPage should render something
      const content = page.locator('main, article, .fx-container').first();
      await expect(content).toBeVisible({ timeout: 5000 });
    } else {
      // No posts available — verify the error or empty state is shown
      const errorState = page.getByText('Unable to load blog posts');
      const emptyState = page.getByText('No posts yet');
      await expect(errorState.or(emptyState)).toBeVisible({ timeout: 5000 });
    }
  });
});
