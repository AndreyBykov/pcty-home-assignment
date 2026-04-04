/* ----- DISABLED: AUTH SETUP -----
import { test as setup, expect } from '@playwright/test';

import { config } from '@config';
import { API_ROUTES, ROUTES } from '@consts';

setup('authenticate', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    await page.getByLabel('Username').fill(config.username);
    await page.getByLabel('Password').fill(config.password);

    await Promise.all([
        page.getByRole('button', { name: 'Log In' }).click(),
        page.waitForResponse(API_ROUTES.EMPLOYEES),
    ]);

    await expect(page).toHaveURL(ROUTES.DASHBOARD);
    await expect(page).toHaveTitle('Employees - Paylocity Benefits Dashboard');

    await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
*/
