import { Locator, Page } from '@playwright/test';

import { ROUTES, SELECTORS } from '@consts';
import { config } from '@config';
import { expect } from '@fixtures';

export abstract class BasePage {
    readonly loginForm: Locator;
    readonly loginUsernameInput: Locator;
    readonly loginPasswordInput: Locator;
    readonly loginButton: Locator;

    readonly loginValidationErrors: Locator;

    constructor(public page: Page) {
        this.loginForm = this.page.locator('.login-form-container');
        this.loginUsernameInput = this.loginForm .getByLabel('Username');
        this.loginPasswordInput = this.loginForm .getByLabel('Password');
        this.loginButton = this.loginForm .getByRole('button', { name: 'Log In' });

        this.loginValidationErrors = this.loginForm.locator(SELECTORS.validationErrors);
    }

    async gotoLogin() {
        await this.page.goto(ROUTES.LOGIN);
        await expect(this.loginForm).toBeVisible();
    }

    async fillAndSubmitCredentials (login = config.username, password = config.password) {
        await this.loginUsernameInput.fill(login);
        await this.loginPasswordInput.fill(password);

        await Promise.all([
            this.loginButton.click(),
            this.page.waitForLoadState('networkidle'),
        ]);
    }
}
