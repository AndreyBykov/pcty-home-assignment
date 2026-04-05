export const ROUTES = {
    LOGIN: 'Prod/Account/Login',
    DASHBOARD: 'Prod/Benefits',
} as const;

export const API_ROUTES = {
    EMPLOYEES: 'Prod/api/employees',
} as const;

export const SELECTORS = {
    validationErrors: '.validation-summary-errors',

    employeesTable: '#employeesTable',

    employeeModal: '#employeeModal',
    editEmployeeButton: '.fa-edit',
    deleteEmployeeButton: '.fa-times',

    deleteEmployeeModal: '#deleteModal',
};

export const MODAL_ACTIONS = {
    ADD: 'add',
    UPDATE: 'update',
    CANCEL: 'cancel',
} as const;

export type ModalAction = typeof MODAL_ACTIONS[keyof typeof MODAL_ACTIONS];

export const PAYCHECK_AMOUNT_GROSS = 2_000;
export const PAYCHECK_QTY_YEAR = 26;
export const INCOME_AMOUNT_YEAR_GROSS = PAYCHECK_AMOUNT_GROSS * PAYCHECK_QTY_YEAR;

export const EMPLOYEE_BENEFITS_COST_YEAR = 1_000;
export const DEPENDENT_BENEFITS_COST_YEAR = 500;

export const TOTAL_BENEFITS_COST_YEAR = (dependentCount: number) => {
    return (EMPLOYEE_BENEFITS_COST_YEAR + (DEPENDENT_BENEFITS_COST_YEAR * dependentCount));
};

export const TOTAL_BENEFITS_COST_PAYCHECK = (dependentCount: number) => {
    return TOTAL_BENEFITS_COST_YEAR(dependentCount) / PAYCHECK_QTY_YEAR;
};

export const PAYCHECK_AMOUNT_NET = (dependentCount: number) => {
    return PAYCHECK_AMOUNT_GROSS - TOTAL_BENEFITS_COST_PAYCHECK(dependentCount);
};

export const DASHBOARD_ROW_ENTRY_COUNT = 9;

export const TEST_EMPLOYEE_INFO = {
    FIRST_NAME: 'John',
    LAST_NAME: 'Doe',
    DEPENDENTS: 1,
};
