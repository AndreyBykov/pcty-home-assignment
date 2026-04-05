export interface Employee {
    firstName: string;
    lastName: string;
    dependants: number;
}

export type EmployeeApiInput = Partial<Employee> & {
    username?: string;
};

export interface EmployeeApiResponse extends Employee {
    partitionKey: string;
    sortKey: string;
    username: string;
    id: string;
    salary: number;
    gross: number;
    benefitsCost: number;
    net: number;
    expiration?: string;
}

export interface EmployeeApiFailure {
    memberNames: string[];
    errorMessage: string;
}
