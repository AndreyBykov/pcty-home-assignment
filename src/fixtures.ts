import { test as base } from '@playwright/test';

import { DashboardPage } from '@pages/dashboard.js';
import { EmployeeService } from '@services/employee.js';
import { EmployeeApiResponse } from '@models/employee.js';

interface fixtures {
    dashboard: DashboardPage;
    service: EmployeeService;
    seededEmployee: EmployeeApiResponse;
    employeeIds: string[];
}

export const test = base.extend<fixtures>({
    dashboard: async ({ page }, use) => {
        const dashboardPage = new DashboardPage(page);
        await use(dashboardPage);
    },
    service: async ({ request }, use) => {
        const service = new EmployeeService(request);
        await use(service);
    },
    seededEmployee: async ({ service }, use) => {
        const employee = await service.addEmployee();
        await use(employee);
        await service.deleteEmployee(employee.id);
    },
    employeeIds: async ({ service }, use) => {
        const ids: string[] = [];
        await use(ids);
        for (const id of ids) await service.deleteEmployee(id);
    },
});

export { expect } from '@playwright/test';
export type { Locator } from '@playwright/test';
