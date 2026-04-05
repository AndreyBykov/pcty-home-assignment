import { test, expect } from '@fixtures';
import type { Locator } from '@fixtures';

import {
    API_ROUTES,
    DASHBOARD_ROW_ENTRY_COUNT,
    INCOME_AMOUNT_YEAR_GROSS,
    MODAL_ACTIONS,
    PAYCHECK_AMOUNT_GROSS,
    PAYCHECK_AMOUNT_NET, SELECTORS,
    TEST_EMPLOYEE_INFO,
    TOTAL_BENEFITS_COST_PAYCHECK,
} from '@consts';
import { getEmployeeId, uuidPattern } from '@utils';
import { EmployeeApiResponse } from '@models/employee.js';

test.describe('Benefits dashboard employee management', () => {
    test.beforeEach(async ({ dashboard }) => {
        await dashboard.goto();
    });

    test.afterEach(async ({ service }, { annotations }) => {
        const employeeId = getEmployeeId(annotations as Record<'type' | 'description', string>[]);
        if (employeeId) await service.deleteEmployee(employeeId);
    });

    test('should add a new employee with accurate benefit cost calculations', { tag: '@smoke' }, async ({ dashboard }, { annotations }) => {
        const tableRowCountOriginal = await dashboard.employeesTableRow.count();

        await test.step('Initiate new employee record creation', async () => {
            await dashboard.openEmployeeModal();
        });

        const uniqueName = `${TEST_EMPLOYEE_INFO.FIRST_NAME}_${Date.now()}`;

        await test.step('Enter employee details and save', async () => {
            dashboard.addEmployeeListener(annotations as Record<'type' | 'description', string>[]);
            await dashboard.fillAndResolveEmployeeModal({
                name: uniqueName,
                surname: TEST_EMPLOYEE_INFO.LAST_NAME,
                dependents: TEST_EMPLOYEE_INFO.DEPENDENTS,
            });
        });

        let testRow: Locator;

        await test.step('Verify employee is visible in the table', async () => {
            await expect(dashboard.employeesTableRow).toHaveCount(tableRowCountOriginal + 1);

            const tableRows = dashboard.employeesTableRow;
            const employeeId = getEmployeeId(annotations as Record<'type' | 'description', string>[]);

            testRow = tableRows.filter({ hasText: employeeId });
            await expect(testRow).toBeVisible();
        });

        await test.step('Verify employee data and benefit calculation', async () => {
            const rowEntry = testRow!.locator('td');
            await expect(rowEntry).toHaveCount(DASHBOARD_ROW_ENTRY_COUNT);

            const entries = await rowEntry.all();
            await expect(entries[0]).toHaveText(uuidPattern);
            await expect(entries[1]).toHaveText(uniqueName);
            await expect(entries[2]).toHaveText(TEST_EMPLOYEE_INFO.LAST_NAME);
            await expect(entries[3]).toHaveText(TEST_EMPLOYEE_INFO.DEPENDENTS.toString());
            await expect(entries[4]).toHaveText(INCOME_AMOUNT_YEAR_GROSS.toFixed(2));
            await expect(entries[5]).toHaveText(PAYCHECK_AMOUNT_GROSS.toFixed(2));
            await expect(entries[6]).toHaveText(TOTAL_BENEFITS_COST_PAYCHECK(TEST_EMPLOYEE_INFO.DEPENDENTS).toFixed(2));
            await expect(entries[7]).toHaveText(PAYCHECK_AMOUNT_NET(TEST_EMPLOYEE_INFO.DEPENDENTS).toFixed(2));
        });
    });

    test('should not add employee when modal is cancelled', async ({ dashboard }, { annotations }) => {
        const tableRowCountOriginal = await dashboard.employeesTableRow.count();

        await test.step('Initiate new employee record creation', async () => {
            await dashboard.openEmployeeModal();
        });

        await test.step('Enter employee details and cancel', async () => {
            dashboard.addEmployeeListener(annotations as Record<'type' | 'description', string>[]);
            await dashboard.fillAndResolveEmployeeModal({
                name: TEST_EMPLOYEE_INFO.FIRST_NAME,
                surname: TEST_EMPLOYEE_INFO.LAST_NAME,
                dependents: TEST_EMPLOYEE_INFO.DEPENDENTS,
                action: MODAL_ACTIONS.CANCEL,
            });
        });

        await test.step('Verify no changes were saved', async () => {
            await expect(dashboard.employeeModal).toBeHidden();
            await expect(dashboard.employeesTableRow).toHaveCount(tableRowCountOriginal);

            const employeeId = getEmployeeId(annotations as Record<'type' | 'description', string>[]);
            expect(employeeId).toBeUndefined();
        });
    });

    // Trying to add an employee with incomplete data silently fails on Back-End with error 405,
    // and no validation errors are show. Marking it as test.fail() until it's fixed
    // Same applies to no data (saving with empty strings).
    // There could also be more edge-cases like exceeding max number of dependents, etc.,
    // but this is more suitable for component testing,
    // while it could be a good idea to have at least one test for this in e2e to confirm that
    // validation actually works, shown, and user is not saved.
    test.fail('should not add an employee with partial data and show validation errors', async ({ dashboard }) => {
        await test.step('Initiate new employee record creation', async () => {
            await dashboard.openEmployeeModal();
        });

        await test.step('Enter employee details and save', async () => {
            await dashboard.employeeModalFirstNameInput.fill(TEST_EMPLOYEE_INFO.FIRST_NAME);
            await Promise.all([
                dashboard.employeeModalAddButton.click(),
                dashboard.page.waitForResponse(API_ROUTES.EMPLOYEES),
            ]);
        });

        await test.step('Verify validation errors are shown (and employee is not saved)', async () => {
            await expect(dashboard.employeeModal).toBeVisible();
            await expect(dashboard.employeeModalValidationErrors).toBeVisible();
            await expect(dashboard.employeeModalValidationErrors).toHaveText(/The Last Name field is required/);
        });
    });
});

test.describe('Editing an existing employee record', () => {
    let employeeInfo: EmployeeApiResponse;

    test.beforeEach(async ({ dashboard, service }) => {
        employeeInfo = await service.addEmployee();
        await dashboard.goto();
    });

    test.afterEach(async ({ service }) => {
        await service.deleteEmployee(employeeInfo.id);
    });

    test('should edit an existing employee and reflect the changes in the dashboard', async ({ dashboard }) => {
        const testRow = dashboard.employeesTableRow.filter({ hasText: employeeInfo.id });

        await test.step('Verify employee is visible in the table', async () => {
            await expect(testRow).toBeVisible();
        });

        await test.step('Verify original employee data and benefit calculation', async () => {
            const rowEntry = testRow.locator('td');
            await expect(rowEntry).toHaveCount(DASHBOARD_ROW_ENTRY_COUNT);

            const entries = await rowEntry.all();
            await expect(entries[0]).toHaveText(employeeInfo.id);
            await expect(entries[1]).toHaveText(employeeInfo.firstName);
            await expect(entries[2]).toHaveText(TEST_EMPLOYEE_INFO.LAST_NAME);
            await expect(entries[3]).toHaveText(TEST_EMPLOYEE_INFO.DEPENDENTS.toString());
            await expect(entries[4]).toHaveText(INCOME_AMOUNT_YEAR_GROSS.toFixed(2));
            await expect(entries[5]).toHaveText(PAYCHECK_AMOUNT_GROSS.toFixed(2));
            await expect(entries[6]).toHaveText(TOTAL_BENEFITS_COST_PAYCHECK(TEST_EMPLOYEE_INFO.DEPENDENTS).toFixed(2));
            await expect(entries[7]).toHaveText(PAYCHECK_AMOUNT_NET(TEST_EMPLOYEE_INFO.DEPENDENTS).toFixed(2));
        });

        const updatedName = 'Jane';
        const updatedSurname = 'Smith';
        const updatedDependents = 3;

        await test.step('Update employee info', async () => {
            await testRow.locator(SELECTORS.editEmployeeButton).click();
            await expect(dashboard.employeeModal).toBeVisible();

            await dashboard.fillAndResolveEmployeeModal({
                name: updatedName,
                surname: updatedSurname,
                dependents: updatedDependents,
                action: MODAL_ACTIONS.UPDATE,
            });
        });

        await test.step('Verify updated employee data and benefit calculation', async () => {
            const rowEntry = testRow.locator('td');
            const entries = await rowEntry.all();
            await expect(entries[0]).toHaveText(employeeInfo.id);
            await expect(entries[1]).toHaveText(updatedName);
            await expect(entries[2]).toHaveText(updatedSurname);
            await expect(entries[3]).toHaveText(updatedDependents.toString());
            await expect(entries[4]).toHaveText(INCOME_AMOUNT_YEAR_GROSS.toFixed(2));
            await expect(entries[5]).toHaveText(PAYCHECK_AMOUNT_GROSS.toFixed(2));
            await expect(entries[6]).toHaveText(TOTAL_BENEFITS_COST_PAYCHECK(updatedDependents).toFixed(2));
            await expect(entries[7]).toHaveText(PAYCHECK_AMOUNT_NET(updatedDependents).toFixed(2));
        });
    });

    // Similar to validation during adding an employee, we could add the same tests for editing an employee here.
});

test.describe('Deleting an existing employee record', () => {
    let employeeInfo: EmployeeApiResponse;

    test.beforeEach(async ({ dashboard, service }) => {
        employeeInfo = await service.addEmployee();
        await dashboard.goto();
    });

    // Skipping test.afterEach() with the record clean-up here,
    // but it could be a good idea to have it here in real project
    // in case automated deletion fails / something goes wrong with the test

    test('should delete an existing employee and reflect the changes in the dashboard', async ({ dashboard }) => {
        const testRow = dashboard.employeesTableRow.filter({ hasText: employeeInfo.id });

        await test.step('Verify employee is visible in the table', async () => {
            await expect(testRow).toBeVisible();
        });

        await test.step('Delete an employee', async () => {
            await testRow.locator(SELECTORS.deleteEmployeeButton).click();
            await expect(dashboard.deleteEmployeeModal).toBeVisible();

            await Promise.all([
                dashboard.deleteEmployeeModalConfirmButton.click(),
                dashboard.page.waitForResponse(API_ROUTES.EMPLOYEES),
            ]);
        });

        await test.step('Verify employee is no longer visible in the table', async () => {
            await expect(testRow).not.toBeAttached();
        });
    });
});
