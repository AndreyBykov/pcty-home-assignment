import { inspect } from 'node:util';

import { APIRequestContext } from '@playwright/test';

import { API_ROUTES, TEST_EMPLOYEE_INFO } from '@consts';
import { config } from '@config';

import type { EmployeeApiInput, EmployeeApiResponse } from '@models/employee.js';

export class EmployeeService {
    constructor(private request: APIRequestContext) {}

    async addEmployee(employeeApiInput: EmployeeApiInput = {}) {
        const payload: EmployeeApiInput = {
            firstName: `${TEST_EMPLOYEE_INFO.FIRST_NAME}_${Date.now()}`,
            lastName: TEST_EMPLOYEE_INFO.LAST_NAME,
            dependants: TEST_EMPLOYEE_INFO.DEPENDENTS,
            username: config.username,
            ...employeeApiInput,
        };

        const response = await this.request.post(API_ROUTES.EMPLOYEES, {
            headers: { authorization: `Basic ${config.authToken}` },
            data: payload,
        });

        if (response.ok()) {
            const data = await response.json() as EmployeeApiResponse;
            console.log('     -> Added record', inspect({ id: data.id }, { colors: true }));
            return data;
        } else {
            throw new Error(`Failed to add the record. Status: ${response.status()}`);
        }
    }

    async deleteEmployee(employeeId: string) {
        const response = await this.request.delete(`${API_ROUTES.EMPLOYEES}/${employeeId}`, {
            headers: { authorization: `Basic ${config.authToken}` },
        });

        if (response.ok()) {
            console.log('     -> Removed record', inspect({ id: employeeId }, { colors: true }));
        } else {
            console.error(`Failed to delete the record ${employeeId}. Status: ${response.status()}`);
        }
    }
}
