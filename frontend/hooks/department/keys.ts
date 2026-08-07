/**
 * Query-key factory for departments. `all` is the invalidation prefix.
 */
export const departmentKeys = {
  all: ["departments"] as const,
  publicList: () => [...departmentKeys.all, "public"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: () => [...departmentKeys.lists()] as const,
  detail: (id: number) => [...departmentKeys.all, "detail", id] as const,
  dashboard: (id: number) => [...departmentKeys.all, "dashboard", id] as const,
}
