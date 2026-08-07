"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { adminUserService } from "@/services/admin-user-service"
import type { UserStatus } from "@/types/user"
import { adminUserKeys } from "./keys"

/**
 * Change a user's status (approve/reject). The mutation owns cache
 * invalidation; the calling component handles toasts via `mutate(vars, {…})`.
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      adminUserService.updateStatus(id, status),
    // PATCH /admin/users/{id}/status → UserResponseSchema. The row leaves the
    // pending list on success, so invalidate every admin-user list.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all })
    },
  })
}

/** Set an officer's maximum workload (capacity). */
export function useUpdateMaxWorkload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, maxWorkload }: { id: string; maxWorkload: number }) =>
      adminUserService.updateMaxWorkload(id, maxWorkload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all })
    },
  })
}
