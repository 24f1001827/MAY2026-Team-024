/**
 * Query-key factory for the admin agency directory.
 */
export const adminAgencyKeys = {
  all: ["admin-agencies"] as const,
  list: () => [...adminAgencyKeys.all, "list"] as const,
  detail: (id: string) => [...adminAgencyKeys.all, "detail", id] as const,
}
