import { v4 as uuidv4 } from 'uuid';

import { test, expect } from '@fixtures';

import { config } from '@config';
import { API_ROUTES, TEST_EMPLOYEE_INFO } from '@consts';
import { EmployeeApiResponse, EmployeeApiFailure } from '@models/employee.js';
import { validateRecord, validateSchema } from '@utils';
import { APIResponse } from '@playwright/test';

test.describe('api/employees operations and calculations', () => {
    test.describe('Security & Authentication', () => {
        test('should return 401 (Unauthorized) when missing Auth header', async ({ request }) => {
            const response = await request.get(API_ROUTES.EMPLOYEES);
            expect(response.status()).toBe(401);
        });

        test('should return 401 (Unauthorized) with invalid Auth header', async ({ request }) => {
            const response = await request.get(API_ROUTES.EMPLOYEES, {
                headers: { authorization: 'Basic Auth Token' },
            });
            expect(response.status()).toBe(401);
        });

        test('should return 200 (OK) with valid Auth header', async ({ request }) => {
            const response = await request.get(API_ROUTES.EMPLOYEES, {
                headers: { authorization: `Basic ${config.authToken}` },
            });
            expect(response.status()).toBe(200);
        });

        // The input is currently not sanitized, and the record is saved as-is.
        // Request should be either rejected, or the input should be sanitized.
        // Marking it as test.fail() until it's fixed
        test.fail('API must sanitize or reject executable script payloads (Stored XSS)', async ({ request, employeeIds }) => {
            let response: APIResponse;

            await test.step('Try to create an employee record with corrupted data', async () => {
                const inputData = {
                    firstName: '<script>alert(\'xss\')</script>',
                    lastName: 'SecurityTest',
                    dependants: 0,
                };

                response = await request.post(API_ROUTES.EMPLOYEES, {
                    headers: { authorization: `Basic ${config.authToken}` },
                    data: inputData,
                });
            });

            // Adding this just for the sake of cleanup, since currently the
            // input is not sanitized, and the record is saved as-is.
            if (response!.ok()) {
                const { id } = await response!.json() as EmployeeApiResponse;
                employeeIds.push(id);
            }

            await test.step('Verify request was rejected with meaningful validation error message', async () => {
                await expect(response).not.toBeOK();
            });

            await test.step('Verify meaningful validation error message is returned', async () => {
                const responseData = await response.json() as EmployeeApiFailure[];
                const errorMessages = responseData.map((entry) => entry.errorMessage);
                expect(errorMessages).toContain('The FirstName field contains executable script');
            });
        });
    });

    test.describe('Employee CRUD operations (happy path)', () => {
        test('should create an employee (POST)', async ({ request, employeeIds }) => {
            let createdRecord: EmployeeApiResponse;

            await test.step('Create an employee and verify response matches the input', async () => {
                const inputData = {
                    firstName: `${TEST_EMPLOYEE_INFO.FIRST_NAME}_${Date.now()}`,
                    lastName: TEST_EMPLOYEE_INFO.LAST_NAME,
                    dependants: TEST_EMPLOYEE_INFO.DEPENDENTS,
                };

                const postResponse = await request.post(API_ROUTES.EMPLOYEES, {
                    headers: { authorization: `Basic ${config.authToken}` },
                    data: inputData,
                });
                await expect(postResponse).toBeOK(); // Returns 200, should rather return 201

                createdRecord = await postResponse.json() as EmployeeApiResponse;
                validateSchema(createdRecord);
                validateRecord(createdRecord, inputData);

                employeeIds.push(createdRecord.id);
            });

            await test.step('Fetch created record and verify it matches the POST response', async () => {
                const getResponse = await request.get(`${API_ROUTES.EMPLOYEES}/${createdRecord.id}`, {
                    headers: { authorization: `Basic ${config.authToken}` },
                });
                await expect(getResponse).toBeOK();

                const fetchedRecord = await getResponse.json() as EmployeeApiResponse;
                validateSchema(fetchedRecord);

                validateRecord(fetchedRecord, createdRecord);
            });
        });

        test('should retrieve a list of employees (GET)', async ({ request, seededEmployee }) => {
            let responseData: EmployeeApiResponse[];

            await test.step('Fetch the list of employee records and verify it contains records', async () => {
                const response = await request.get(API_ROUTES.EMPLOYEES, {
                    headers: { authorization: `Basic ${config.authToken}` },
                });
                expect(response.status()).toBe(200);

                responseData = await response.json() as EmployeeApiResponse[];

                expect(Array.isArray(responseData)).toBe(true);
                expect(responseData.length).toBeGreaterThan(0);
            });

            await test.step('Verify the pre-seeded record is present in the list and has correct data', () => {
                const employeeRecord = responseData
                    .find((record) => record.id === seededEmployee.id);
                expect(employeeRecord).toBeDefined();

                validateSchema(employeeRecord!);
                validateRecord(employeeRecord!, seededEmployee);
            });
        });

        test('should retrieve a specific employee (GET)', async ({ request, seededEmployee }) => {
            let responseData: EmployeeApiResponse;

            await test.step('Fetch the pre-seeded employee record', async () => {
                const response = await request.get(`${API_ROUTES.EMPLOYEES}/${seededEmployee.id}`, {
                    headers: { authorization: `Basic ${config.authToken}` },
                });
                expect(response.status()).toBe(200);

                responseData = await response.json() as EmployeeApiResponse;
            });

            await test.step('Verify the fetched record has correct data', () => {
                expect(responseData).toBeDefined();

                validateSchema(responseData);
                validateRecord(responseData, seededEmployee);
            });
        });

        test('should update an existing employee (PUT)', async ({ request, seededEmployee }) => {
            await test.step('Fetch the pre-seeded employee record', async () => {
                const response = await request.get(`${API_ROUTES.EMPLOYEES}/${seededEmployee.id}`, {
                    headers: { authorization: `Basic ${config.authToken}` },
                });
                expect(response.status()).toBe(200);
            });

            const updatedData = {
                id: seededEmployee.id,
                firstName: 'Jane',
                lastName: 'Smith',
                dependants: 3,
            };

            await test.step('Update pre-seeded employee record', async () => {
                const response = await request.put(API_ROUTES.EMPLOYEES, {
                    headers: { authorization: `Basic ${config.authToken}` },
                    data: updatedData,
                });
                expect(response.status()).toBe(200);
            });

            let responseData: EmployeeApiResponse;

            await test.step('Fetch the updated employee record', async () => {
                const response = await request.get(`${API_ROUTES.EMPLOYEES}/${seededEmployee.id}`, {
                    headers: { authorization: `Basic ${config.authToken}` },
                });
                expect(response.status()).toBe(200);

                responseData = await response.json() as EmployeeApiResponse;
            });

            await test.step('Verify the fetched record has correct (updated) data', () => {
                expect(responseData).toBeDefined();

                validateSchema(responseData);
                validateRecord(responseData, updatedData);
            });
        });

        test('should delete an employee (DELETE)', async ({ request, seededEmployee }) => {
            await test.step('Verify pre-seeded record exists', async () => {
                const response = await request.get(`${API_ROUTES.EMPLOYEES}/${seededEmployee.id}`, {
                    headers: { authorization: `Basic ${config.authToken}` },
                });
                expect(response.status()).toBe(200);
            });

            await test.step('Delete the pre-seeded record', async () => {
                const response = await request.delete(`${API_ROUTES.EMPLOYEES}/${seededEmployee.id}`, {
                    headers: { authorization: `Basic ${config.authToken}` },
                });
                expect(response.status()).toBe(200);
                expect(await response.text()).toBeFalsy();
            });

            await test.step('Verify pre-seeded record could no longer be fetched', async () => {
                const response = await request.get(`${API_ROUTES.EMPLOYEES}/${seededEmployee.id}`, {
                    headers: { authorization: `Basic ${config.authToken}` },
                });
                expect(await response.text()).toBeFalsy();
                // The record is actually removed from the db,
                // However, the response comes with status 200, which is not ideal.
                // Uncomment once it's fixed.
                // expect(response.status()).toBe(404);
            });
        });
    });

    test.describe('Dependent Calculations', () => {
        const scenarios = [0, 1, 5, 20];

        for (const dependentCount of scenarios) {
            test(`should correctly calculate paycheck for ${dependentCount} dependents`, async ({ service, employeeIds }) => {
                let createdRecord: EmployeeApiResponse;

                await test.step(`Create an employee with ${dependentCount} dependents`, async () => {
                    createdRecord = await service.addEmployee({ dependants: dependentCount });
                    employeeIds.push(createdRecord.id);
                });

                await test.step('Validate created record', () => {
                    validateSchema(createdRecord);
                    validateRecord(createdRecord, {
                        firstName: createdRecord.firstName,
                        lastName: createdRecord.lastName,
                        dependants: dependentCount,
                    });
                });
            });
        }
    });

    test.describe('Negative Scenarios & Validation', () => {
        const scenarios = [
            {
                description: 'negative dependents',
                data: { firstName: 'John', lastName: 'Doe', dependants: -1 },
                expectedErrors: ['The field Dependants must be between 0 and 32.'],
            },
            {
                description: 'dependents exceeding max value',
                data: { firstName: 'John', lastName: 'Doe', dependants: 33 },
                expectedErrors: ['The field Dependants must be between 0 and 32.'],
            },
            {
                description: 'incomplete data (missing names)',
                data: { dependants: 5 },
                expectedErrors: ['The FirstName field is required.', 'The LastName field is required.'],
            },
        ];

        // Same tests could be added for Update operations (checked manually)
        for (const { description, data, expectedErrors } of scenarios) {
            test(`should reject creation of record with ${description}`, async ({ request }) => {
                let response: APIResponse;

                await test.step('Try to create an employee record', async () => {
                    response = await request.post(API_ROUTES.EMPLOYEES, {
                        headers: { authorization: `Basic ${config.authToken}` },
                        data,
                    });
                });

                await test.step('Verify request was rejected', async () => {
                    await expect(response).not.toBeOK();
                });

                await test.step('Verify meaningful validation errors are returned', async () => {
                    const responseData = await response.json() as EmployeeApiFailure[];
                    const errorMessages = responseData.map((entry) => entry.errorMessage);
                    expect(errorMessages).toEqual(expectedErrors);
                });
            });
        }

        // Response comes with status 200, which is not ideal.
        // Marking it as test.fail() until it's fixed
        test.fail('Should handle GET for non-existent employee gracefully', async ({ request }) => {
            const response = await request.get(`${API_ROUTES.EMPLOYEES}/${uuidv4()}`, {
                headers: { authorization: `Basic ${config.authToken}` },
            });

            expect(await response.text()).toBeFalsy();
            expect(response.status()).toBe(404);
        });
    });
});
