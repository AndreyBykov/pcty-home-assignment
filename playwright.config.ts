import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Back-end seems to be not able to run the tests in parallel with the same login
    reporter: [
        ['html', { open: 'never' }],
        ['list', { printSteps: true }],
        ['github'],
    ],
    use: {
        trace: 'on-first-retry',
        headless: !!process.env.CI,
        baseURL: 'https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com',
    },
    projects: [
        /* ----- DISABLED: AUTH SETUP & SMOKE TESTS -----
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },
        {
            name: 'ui-smoke-chrome',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
            grep: /@smoke/,
        },
        */
        {
            name: 'ui-chrome',
            use: {
                ...devices['Desktop Chrome'],
                channel: 'chromium',
                // storageState: 'playwright/.auth/user.json',
            },
            // dependencies: ['setup'],
            // grepInvert: /@smoke/,
        },
        {
            name: 'api',
            testMatch: /api\.spec\.ts/,
        },
    ],
});
