// WEB ONLY — deploy-web/tests/console-errors.spec.ts
// Diagnostic test: navigates every major page and collects console errors + network failures.
import { test, expect, type Page } from '@playwright/test';
import { gotoPage, signIn, getFirstVenueId, getFirstVendorId } from './helpers';

interface CollectedErrors {
  consoleErrors: string[];
  networkErrors: string[];
}

function attachErrorListeners(page: Page): CollectedErrors {
  const errors: CollectedErrors = { consoleErrors: [], networkErrors: [] };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    // Ignore favicon and other non-critical resource failures
    if (!url.includes('favicon') && !url.includes('robots.txt')) {
      errors.networkErrors.push(`${req.method()} ${url} — ${req.failure()?.errorText || 'failed'}`);
    }
  });

  page.on('response', (resp) => {
    if (resp.status() >= 400) {
      const url = resp.url();
      // Ignore favicon and non-critical resources
      if (!url.includes('favicon') && !url.includes('robots.txt')) {
        errors.networkErrors.push(`${resp.status()} ${url}`);
      }
    }
  });

  return errors;
}

function expectNoErrors(errors: CollectedErrors, pageName: string) {
  // Filter out known acceptable errors (e.g. HubSpot CORS, 404 for optional resources)
  const filteredConsole = errors.consoleErrors.filter((e) => {
    // HubSpot blog API CORS is a known issue handled by proxy
    if (e.includes('hubapi.com') || e.includes('CORS')) return false;
    // React DevTools is a browser extension, not our code
    if (e.includes('React DevTools')) return false;
    // Google Maps API warnings are not critical
    if (e.includes('maps.googleapis.com') && !e.includes('API key')) return false;
    // "Failed to load resource" with no URL detail is too vague to be actionable
    // and is usually accompanied by a more specific network error entry
    if (e.startsWith('Failed to load resource: the server responded with a status of 4')) return false;
    return true;
  });

  const filteredNetwork = errors.networkErrors.filter((e) => {
    // HubSpot blog API CORS is a known issue
    if (e.includes('hubapi.com')) return false;
    // Google Maps API failures on profile pages are handled by fallback
    if (e.includes('maps.googleapis.com')) return false;
    // ERR_ABORTED for Google Fonts are cancelled font loads (page navigation/re-render)
    if (e.includes('fonts.gstatic.com') && e.includes('ERR_ABORTED')) return false;
    // ERR_ABORTED for Supabase requests are cancelled due to React strict mode double-rendering
    if (e.includes('supabase.co') && e.includes('ERR_ABORTED')) return false;
    // ERR_ABORTED for external images (Unsplash, etc.) are cancelled loads in headless browser
    if (e.includes('ERR_ABORTED') && (e.includes('images.unsplash.com') || e.includes('images.ctfassets.net'))) return false;
    return true;
  });

  if (filteredConsole.length > 0 || filteredNetwork.length > 0) {
    console.error(`\n=== ERRORS ON ${pageName} ===`);
    if (filteredConsole.length > 0) {
      console.error('Console errors:');
      filteredConsole.forEach((e) => console.error(`  - ${e}`));
    }
    if (filteredNetwork.length > 0) {
      console.error('Network errors:');
      filteredNetwork.forEach((e) => console.error(`  - ${e}`));
    }
    console.error('=== END ERRORS ===\n');
  }

  expect(filteredConsole, `Console errors on ${pageName}`).toEqual([]);
  expect(filteredNetwork, `Network errors on ${pageName}`).toEqual([]);
}

test.describe('Console Error Diagnostics', () => {
  test.describe('Public pages (not signed in)', () => {
    test('home page (/) — no console errors', async ({ page }) => {
      const errors = attachErrorListeners(page);
      await gotoPage(page, '/');
      await page.waitForTimeout(3000);
      expectNoErrors(errors, '/');
    });

    test('discover page (/discover) — no console errors', async ({ page }) => {
      const errors = attachErrorListeners(page);
      await gotoPage(page, '/discover');
      await page.waitForTimeout(3000);
      expectNoErrors(errors, '/discover');
    });

    test('signin page (/signin) — no console errors', async ({ page }) => {
      const errors = attachErrorListeners(page);
      await gotoPage(page, '/signin');
      await page.waitForTimeout(2000);
      expectNoErrors(errors, '/signin');
    });

    test('signup page (/signup) — no console errors', async ({ page }) => {
      const errors = attachErrorListeners(page);
      await gotoPage(page, '/signup');
      await page.waitForTimeout(2000);
      expectNoErrors(errors, '/signup');
    });

    test('blog page (/blog) — no console errors', async ({ page }) => {
      const errors = attachErrorListeners(page);
      await gotoPage(page, '/blog');
      await page.waitForTimeout(3000);
      expectNoErrors(errors, '/blog');
    });
  });

  test.describe('Auth-required pages (signed in)', () => {
    test('account page (/account) — no console errors', async ({ page }) => {
      const errors = attachErrorListeners(page);
      await signIn(page);
      // signIn already navigates to /account
      await page.waitForTimeout(3000);
      expectNoErrors(errors, '/account');
    });

    test('planner page (/planner) — no console errors', async ({ page }) => {
      await signIn(page);
      const errors = attachErrorListeners(page);
      await gotoPage(page, '/planner');
      await page.waitForTimeout(3000);
      expectNoErrors(errors, '/planner');
    });

    test('quotes page (/quotes) — no console errors', async ({ page }) => {
      await signIn(page);
      const errors = attachErrorListeners(page);
      await gotoPage(page, '/quotes');
      await page.waitForTimeout(3000);
      expectNoErrors(errors, '/quotes');
    });

    test('listers-portal page (/listers-portal) — no console errors', async ({ page }) => {
      await signIn(page);
      const errors = attachErrorListeners(page);
      await gotoPage(page, '/listers-portal');
      await page.waitForTimeout(3000);
      expectNoErrors(errors, '/listers-portal');
    });

    test('portfolio-type page (/portfolio-type) — no console errors', async ({ page }) => {
      await signIn(page);
      const errors = attachErrorListeners(page);
      await gotoPage(page, '/portfolio-type');
      await page.waitForTimeout(3000);
      expectNoErrors(errors, '/portfolio-type');
    });
  });

  test.describe('Profile pages', () => {
    test('venue profile (/venue/:id) — no console errors', async ({ page }) => {
      const venueId = await getFirstVenueId();
      const errors = attachErrorListeners(page);
      await gotoPage(page, `/venue/${venueId}`);
      await page.waitForTimeout(3000);
      expectNoErrors(errors, `/venue/${venueId}`);
    });

    test('vendor profile (/vendor/:id) — no console errors', async ({ page }) => {
      const vendorId = await getFirstVendorId();
      const errors = attachErrorListeners(page);
      await gotoPage(page, `/vendor/${vendorId}`);
      await page.waitForTimeout(3000);
      expectNoErrors(errors, `/vendor/${vendorId}`);
    });
  });
});
