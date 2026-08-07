"use client"

import { useQuery } from "@tanstack/react-query"

import { adminUserService } from "@/services/admin-user-service"
import type { AdminUserFilters } from "@/types/admin-user"
import { adminUserKeys } from "./keys"

/** List users with optional role/status filters. */
export function useUsers(filters: AdminUserFilters = {}) {
  return useQuery({
    queryKey: adminUserKeys.list(filters),
    queryFn: () => adminUserService.list(filters),
  })
}

/**
 * Officers + agencies awaiting admin approval. (Citizens/admins are never
 * `PendingApproval`, so this list is exactly the approval queue.)
 */
export function usePendingApprovals() {
  return useUsers({ status: "PendingApproval" })
}
