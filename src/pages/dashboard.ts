import { Locator, Page, expect } from '@playwright/test';

import { BasePage } from '@pages/base.js';

import { API_ROUTES, MODAL_ACTIONS, ROUTES, SELECTORS } from '@consts';
import type { ModalAction } from '@consts';

interface EmployeeModalOptions {
    name: string;
    surname: string;
    dependents: number;
    action?: ModalAction;
}

export class DashboardPage extends BasePage {
    readonly employeesTable: Locator;
    readonly employeesTableRow: Locator;

    readonly addEmployeeButton: Locator;

    readonly employeeModal: Locator;
    readonly employeeModalFirstNameInput: Locator;
    readonly employeeModalLastNameInput: Locator;
    readonly employeeModalDependentsInput: Locator;
    readonly employeeModalValidationErrors: Locator;
    readonly employeeModalAddButton: Locator;
    readonly employeeModalUpdateButton: Locator;
    readonly employeeModalCancelButton: Locator;

    readonly deleteEmployeeModal: Locator;
    readonly deleteEmployeeModalConfirmButton: Locator;

    constructor(public page: Page) {
        super(page);

        this.employeesTable = this.page.locator(SELECTORS.employeesTable);
        this.employeesTableRow = this.employeesTable.locator('tbody > tr');

        this.addEmployeeButton = this.page.getByRole('button', { name: 'Add Employee' });

        this.employeeModal = this.page.locator(SELECTORS.employeeModal);
        this.employeeModalFirstNameInput = this.employeeModal.getByLabel('First Name');
        this.employeeModalLastNameInput = this.employeeModal.getByLabel('Last Name');
        this.employeeModalDependentsInput = this.employeeModal.getByLabel('Dependents');
        this.employeeModalValidationErrors = this.employeeModal.locator(SELECTORS.validationErrors);
        this.employeeModalAddButton = this.employeeModal.getByRole('button', { name: 'Add' });
        this.employeeModalUpdateButton = this.employeeModal.getByRole('button', { name: 'Update' });
        this.employeeModalCancelButton = this.employeeModal.getByRole('button', { name: 'Cancel' });

        this.deleteEmployeeModal = this.page.locator(SELECTORS.deleteEmployeeModal);
        this.deleteEmployeeModalConfirmButton = this.deleteEmployeeModal.getByRole('button', { name: 'Delete' });
    }

    async goto() {
        await this.gotoLogin();
        await this.fillAndSubmitCredentials();
        await this.verifyDashboardIsLoaded();
    }

    async verifyDashboardIsLoaded() {
        await expect(this.loginForm).not.toBeAttached();
        await expect(this.page).toHaveURL(ROUTES.DASHBOARD);
        await expect(this.page).toHaveTitle('Employees - Paylocity Benefits Dashboard');
        await expect(this.employeesTableRow.first()).toBeVisible();
    }

    addEmployeeListener(employeeIds: string[]) {
        this.page.on('response', async (r) => {
            if (r.status() === 200 && r.request().method() === 'POST' && r.request().url().includes(API_ROUTES.EMPLOYEES)) {
                const { id } = await r.json() as Record<string, string>;
                if (id) employeeIds.push(id);
            }
        });
    }

    async openEmployeeModal() {
        await this.addEmployeeButton.click();
        await expect(this.employeeModal).toBeVisible();
    }

    async fillAndResolveEmployeeModal({ name, surname, dependents, action = MODAL_ACTIONS.ADD }: EmployeeModalOptions) {
        const buttonMap = {
            [MODAL_ACTIONS.ADD]: this.employeeModalAddButton,
            [MODAL_ACTIONS.UPDATE]: this.employeeModalUpdateButton,
            [MODAL_ACTIONS.CANCEL]: this.employeeModalCancelButton,
        };

        await this.employeeModalFirstNameInput.fill(name);
        await this.employeeModalLastNameInput.fill(surname);
        await this.employeeModalDependentsInput.fill(dependents.toString());

        if (action !== MODAL_ACTIONS.CANCEL) {
            await Promise.all([
                buttonMap[action].click(),
                this.page.waitForResponse(API_ROUTES.EMPLOYEES),
            ]);
        } else {
            await buttonMap[action].click();
        }
    }
}
