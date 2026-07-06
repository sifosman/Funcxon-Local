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
    baseURL: 'http://127.0.0.1:4100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/var/lib/flatpak/app/com.google.Chrome/x86_64/stable/b8418a1b65d31feefea1be05b6ffd4f5502bf7ffec0aecde097096ab74d576e0/files/extra/chrome',
        },
      },
    },
  ],
  webServer: {
    command: 'CI=1 npx expo start --web --port 4100',
    url: 'http://127.0.0.1:4100',
    reuseExistingServer: true,
    timeout: 180 * 1000,
  },
});
