import { test as base } from '@playwright/test';

import { DashboardPage } from '@pages/dashboard.js';
import { EmployeeService } from '@services/employee.js';

export const test = base.extend<{ dashboard: DashboardPage, service: EmployeeService }>({
    dashboard: async ({ page }, use) => {
        const dashboardPage = new DashboardPage(page);
        await use(dashboardPage);
    },
    service: async ({ request }, use) => {
        const service = new EmployeeService(request);
        await use(service);
    },
});

export { expect } from '@playwright/test';
export type { Locator } from '@playwright/test';
