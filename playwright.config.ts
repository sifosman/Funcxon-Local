import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: 'http://glph59s-sifosman-8081.exp.direct',
        trace: 'on-first-retry',
        screenshot: 'on',
        video: 'on',
    },
    projects: [
        {
            name: 'Mobile Chrome',
            use: {
                ...devices['Pixel 5'],
            },
        },
    ],
});
