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
import { uuidPattern } from '@utils';

test.describe('Adding an employee record', () => {
    test.beforeEach(async ({ dashboard }) => {
        await dashboard.goto();
    });

    test('should add a new employee with accurate benefit cost calculations', { tag: '@smoke' }, async ({ dashboard, employeeIds }) => {
        const tableRowCountOriginal = await dashboard.employeesTableRow.count();

        await test.step('Initiate new employee record creation', async () => {
            await dashboard.openEmployeeModal();
        });

        const uniqueName = `${TEST_EMPLOYEE_INFO.FIRST_NAME}_${Date.now()}`;

        await test.step('Enter employee details and save', async () => {
            dashboard.addEmployeeListener(employeeIds);
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
            const [employeeId] = employeeIds;

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

    test('should not add employee when modal is cancelled', async ({ dashboard, employeeIds }) => {
        const tableRowCountOriginal = await dashboard.employeesTableRow.count();

        await test.step('Initiate new employee record creation', async () => {
            await dashboard.openEmployeeModal();
        });

        await test.step('Enter employee details and cancel', async () => {
            dashboard.addEmployeeListener(employeeIds);
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

            const [employeeId] = employeeIds;
            expect(employeeId).toBeUndefined();
        });
    });

    // Trying to add an employee with incomplete data silently fails on Back-End with error 405,
    // and no validation errors are shown. Marking it as test.fail() until it's fixed
    //
    // Same applies to e.g. no data (saving with empty strings), exceeding max number of allowed dependents,
    // having negative number of dependants, having text values instead of a number, etc.
    // Currently, no validation is done on front-end, no errors are shown,
    // but this is more suitable for component testing, plus we also check some of these cases in API tests.
    // On the other hand, it could be a good idea to have at least one e2e test for
    // this to confirm that validation actually works, shown, and user is not saved.
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
    test.beforeEach(async ({ dashboard, seededEmployee }) => {
        void seededEmployee; // We need this to trigger the fixture setup without using the value directly in beforeEach
        await dashboard.goto();
    });

    test('should edit an existing employee and reflect the changes in the dashboard', async ({ dashboard, seededEmployee }) => {
        const testRow = dashboard.employeesTableRow.filter({ hasText: seededEmployee.id });

        await test.step('Verify employee is visible in the table', async () => {
            await expect(testRow).toBeVisible();
        });

        await test.step('Verify original employee data and benefit calculation', async () => {
            const rowEntry = testRow.locator('td');
            await expect(rowEntry).toHaveCount(DASHBOARD_ROW_ENTRY_COUNT);

            const entries = await rowEntry.all();
            await expect(entries[0]).toHaveText(seededEmployee.id);
            await expect(entries[1]).toHaveText(seededEmployee.firstName);
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
            await expect(entries[0]).toHaveText(seededEmployee.id);
            await expect(entries[1]).toHaveText(updatedName);
            await expect(entries[2]).toHaveText(updatedSurname);
            await expect(entries[3]).toHaveText(updatedDependents.toString());
            await expect(entries[4]).toHaveText(INCOME_AMOUNT_YEAR_GROSS.toFixed(2));
            await expect(entries[5]).toHaveText(PAYCHECK_AMOUNT_GROSS.toFixed(2));
            await expect(entries[6]).toHaveText(TOTAL_BENEFITS_COST_PAYCHECK(updatedDependents).toFixed(2));
            await expect(entries[7]).toHaveText(PAYCHECK_AMOUNT_NET(updatedDependents).toFixed(2));
        });
    });

    // Similar to test for adding an employee, we could add the same tests for editing an employee here:
    // - check validation errors are shown,
    // - check edge-cases
    // - etc.
    // While again this is more suitable for component testing, I would maybe
    // add at least one to make sure that the record is not saved in real project.
});

test.describe('Deleting an existing employee record', () => {
    test.beforeEach(async ({ dashboard, seededEmployee }) => {
        void seededEmployee; // We need this to trigger the fixture setup without using the value directly in beforeEach
        await dashboard.goto();
    });

    test('should delete an existing employee and reflect the changes in the dashboard', async ({ dashboard, seededEmployee }) => {
        const testRow = dashboard.employeesTableRow.filter({ hasText: seededEmployee.id });

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

    // We have a test above confirming that an employee record is not saved when the modal is cancelled.
    // Would not consider it critical, but we could also add a test confirming, that
    // clicking on 'Delete' and closing the modal does not a actually remove a record.
});
