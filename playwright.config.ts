import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Step 1: ensureTestUser creates disposable auth users + test vendor/venue via Admin API
  // Step 2: auth-setup signs in programmatically and writes storageState files
  globalSetup: require.resolve('./tests/playwright/auth-setup'),
  globalTeardown: require.resolve('./tests/playwright/ensureTestUser'),
  testDir: './tests/playwright',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 120 * 1000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-local',
      testDir: './tests/playwright/mobile',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8081',
        viewport: { width: 390, height: 844 },
        storageState: './tests/playwright/storage-state-attendee.json',
        launchOptions: {
          executablePath: '/var/lib/flatpak/app/com.google.Chrome/x86_64/stable/active/files/extra/chrome',
        },
      },
    },
    {
      name: 'desktop-vercel',
      testDir: './tests/playwright/desktop',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://funcxon-local.vercel.app',
        viewport: { width: 1280, height: 800 },
        storageState: './tests/playwright/storage-state-lister.json',
        launchOptions: {
          executablePath: '/var/lib/flatpak/app/com.google.Chrome/x86_64/stable/active/files/extra/chrome',
        },
      },
    },
    // Legacy project: runs all specs directly in tests/playwright/ (auth.spec.ts, etc.)
    // Uses Vercel baseURL and no storageState (auth specs handle their own login)
    {
      name: 'chromium',
      testDir: './tests/playwright',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*(mobile|desktop)\/.*/,
      use: {
        baseURL: 'https://funcxon-local.vercel.app',
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/var/lib/flatpak/app/com.google.Chrome/x86_64/stable/active/files/extra/chrome',
        },
      },
    },
  ],
});
