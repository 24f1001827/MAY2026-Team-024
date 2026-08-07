/**
 * Query-key factory for officer-scoped data.
 */
export const officerKeys = {
  all: ["officer"] as const,
  departmentDashboard: () =>
    [...officerKeys.all, "department-dashboard"] as const,
  directory: () => [...officerKeys.all, "directory"] as const,
}
