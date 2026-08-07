import type { AdminUserFilters } from "@/types/admin-user"

/**
 * Query-key factory for admin user lists. `all` is the invalidation prefix;
 * `list(filters)` keys each filtered query (e.g. pending approvals).
 */
export const adminUserKeys = {
  all: ["admin-users"] as const,
  lists: () => [...adminUserKeys.all, "list"] as const,
  list: (filters: AdminUserFilters) =>
    [...adminUserKeys.lists(), filters] as const,
}
