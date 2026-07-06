import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: require.resolve('./tests/playwright/ensureTestUser'),
  globalTeardown: require.resolve('./tests/playwright/ensureTestUser'),
  testDir: './tests/playwright',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 120 * 1000,
  use: {
    baseURL: 'https://funcxon-local.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/var/lib/flatpak/app/com.google.Chrome/x86_64/stable/active/files/extra/chrome',
        },
      },
    },
  ],
});
