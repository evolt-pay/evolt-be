export const normalize = (field: any) => {
    if (!field) return undefined;
    if (Array.isArray(field)) return field[0]?.value ?? undefined;
    return field.value ?? undefined;
};
