// ----- DISABLED IN PLAYWRIGHT CONFIG -----
import { test as setup } from '@fixtures';

import { API_ROUTES } from '@consts';

setup('authenticate', async ({ dashboard }) => {
    await setup.step('Navigate to login page', async () => {
        await dashboard.gotoLogin();
    });

    await setup.step('Submit login form with valid credentials', async () => {
        await Promise.all([
            dashboard.fillAndSubmitCredentials(),
            dashboard.page.waitForResponse(API_ROUTES.EMPLOYEES),
        ]);
    });

    await setup.step('Verify dashboard and the data are loaded successfully', async () => {
        await dashboard.verifyDashboardIsLoaded();
    });

    await setup.step('Save session', async () => {
        await dashboard.page.context().storageState({ path: 'playwright/.auth/user.json' });
    });
});
