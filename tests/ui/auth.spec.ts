import { test, expect } from '@fixtures';
import { API_ROUTES, ROUTES } from '@consts';

test.describe('Authentication', () => {
    test('should login with valid credentials', { tag: '@smoke' }, async ({ dashboard }) => {
        await test.step('Navigate to login page', async () => {
            await dashboard.gotoLogin();
        });

        await test.step('Submit login form with valid credentials', async () => {
            await Promise.all([
                dashboard.fillAndSubmitCredentials(),
                dashboard.page.waitForResponse(API_ROUTES.EMPLOYEES),
            ]);
        });

        await test.step('Verify dashboard and the data are loaded successfully', async () => {
            await dashboard.verifyDashboardIsLoaded();
        });
    });

    test('should not login without filling in the credentials', async ({ dashboard }) => {
        await test.step('Navigate to login page', async () => {
            await dashboard.gotoLogin();
        });

        await test.step('Submit login form with valid credentials', async () => {
            await dashboard.fillAndSubmitCredentials('', '');
        });

        await test.step('Verify dashboard is not loaded and validation errors are shown', async () => {
            await expect(dashboard.employeesTableRow).not.toBeAttached();
            await expect(dashboard.loginForm).toBeVisible();
            await expect(dashboard.loginValidationErrors).toBeVisible();
            await expect(dashboard.loginValidationErrors).toHaveText(/The Username field is required/);
            await expect(dashboard.loginValidationErrors).toHaveText(/The Password field is required/);
        });
    });

    // Using wrong credentials results in Error 405 and failed page.
    // Marking it as test.fail() until it's fixed
    test.fail('should not login with invalid credentials', async ({ dashboard }) => {
        await test.step('Navigate to login page', async () => {
            await dashboard.gotoLogin();
        });

        await test.step('Submit login form with invalid credentials', async () => {
            await dashboard.fillAndSubmitCredentials('Wrong', 'Username');
        });

        await test.step('Verify dashboard is not loaded and validation errors are shown', async () => {
            await expect(dashboard.employeesTableRow).not.toBeAttached();
            await expect(dashboard.loginForm).toBeVisible();
            await expect(dashboard.loginValidationErrors).toBeVisible();
            await expect(dashboard.loginValidationErrors).toHaveText(/Wrong email and\/or password/);
        });
    });

    // Navigating directly to the dashboard while not being logged in does not redirect to login page.
    // Instead, the dashboard with no data is loaded. Marking it as test.fail() until it's fixed
    test.fail('should not load dashboard via direct link without authentication', async ({ dashboard }) => {
        await test.step('Navigate to dashboard without login', async () => {
            await dashboard.page.goto(ROUTES.DASHBOARD);
        });

        await test.step('Verify redirect ot login page', async () => {
            await expect(dashboard.loginForm).toBeAttached();
            await expect(dashboard.page).toHaveURL(ROUTES.LOGIN);
            await expect(dashboard.page).toHaveTitle('Log In - Paylocity Benefits Dashboard');
        });
    });
});


