export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getEmployeeId(annotations: Record<'type' | 'description', string>[]) {
    const employeeAnnotation = annotations
        .find((a) => a.type === 'employeeId');
    return employeeAnnotation?.description;
}
