/**
 * Query-key factory for officer-scoped data.
 */
export const officerKeys = {
  all: ["officer"] as const,
  departmentDashboard: () =>
    [...officerKeys.all, "department-dashboard"] as const,
  directory: () => [...officerKeys.all, "directory"] as const,
  tenders: () => [...officerKeys.all, "tenders"] as const,
  tenderProposals: (tenderId: number) =>
    [...officerKeys.all, "tenders", tenderId, "proposals"] as const,
  proposal: (proposalId: number) =>
    [...officerKeys.all, "proposals", proposalId] as const,
}
