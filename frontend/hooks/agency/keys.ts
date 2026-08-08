/**
 * Query-key factory for agency-portal data.
 */
export const agencyKeys = {
  all: ["agency"] as const,
  openTenders: () => [...agencyKeys.all, "tenders"] as const,
  tender: (id: number) => [...agencyKeys.all, "tenders", id] as const,
  proposals: () => [...agencyKeys.all, "proposals"] as const,
  workOrders: () => [...agencyKeys.all, "work-orders"] as const,
  workOrder: (id: number) => [...agencyKeys.all, "work-orders", id] as const,
}
