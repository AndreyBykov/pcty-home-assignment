import { expect } from '@playwright/test';

import { config } from '@config';
import { Employee, EmployeeApiResponse } from '@models/employee.js';
import { INCOME_AMOUNT_YEAR_GROSS, PAYCHECK_AMOUNT_GROSS, PAYCHECK_AMOUNT_NET, TOTAL_BENEFITS_COST_PAYCHECK } from '@consts';

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateSchema(employeeRecord: EmployeeApiResponse) {
    expect(typeof employeeRecord.partitionKey).toBe('string');
    expect(typeof employeeRecord.sortKey).toBe('string');
    expect(typeof employeeRecord.username).toBe('string');
    expect(typeof employeeRecord.id).toBe('string');
    expect(typeof employeeRecord.firstName).toBe('string');
    expect(typeof employeeRecord.lastName).toBe('string');
    expect(typeof employeeRecord.dependants).toBe('number');
    expect(typeof employeeRecord.salary).toBe('number');
    expect(typeof employeeRecord.gross).toBe('number');
    expect(typeof employeeRecord.benefitsCost).toBe('number');
    expect(typeof employeeRecord.net).toBe('number');
}

export function validateRecord(actualRecord: EmployeeApiResponse, expectedRecord: Employee | EmployeeApiResponse) {
    expect(actualRecord.partitionKey).toBe(config.username);
    expect(actualRecord.sortKey).toMatch(uuidPattern);
    expect(actualRecord.username).toBe(config.username);
    expect(actualRecord.id).toMatch(uuidPattern);

    expect(actualRecord).toMatchObject({
        firstName: expectedRecord.firstName,
        lastName: expectedRecord.lastName,
        dependants: expectedRecord.dependants,
    });

    expect(actualRecord.salary).toBe(INCOME_AMOUNT_YEAR_GROSS);
    expect(actualRecord.gross).toBe(PAYCHECK_AMOUNT_GROSS);
    expect(actualRecord.benefitsCost).toBeCloseTo(TOTAL_BENEFITS_COST_PAYCHECK(expectedRecord.dependants), 2);
    expect(actualRecord.net).toBeCloseTo(PAYCHECK_AMOUNT_NET(expectedRecord.dependants), 2);
}
