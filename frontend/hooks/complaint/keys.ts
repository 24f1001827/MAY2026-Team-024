/**
 * Query-key factory for complaints. `all` is the invalidation prefix.
 */
export const complaintKeys = {
  all: ["complaints"] as const,
  mine: () => [...complaintKeys.all, "mine"] as const,
  adminList: () => [...complaintKeys.all, "admin"] as const,
  detail: (id: string) => [...complaintKeys.all, "detail", id] as const,
  cluster: (id: string) => [...complaintKeys.all, "cluster", id] as const,
}
