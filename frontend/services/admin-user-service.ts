/**
 * services/admin-user-service.ts
 *
 * Admin user-management service (approval workflow). Uses the shared `api`
 * client to call this app's admin route handlers, which forward the caller's
 * Bearer token to Flask.
 *
 * Endpoints:
 *   GET   /api/admin/users?role=&status=      → AdminUser[]  (from `{ data }`)
 *   PATCH /api/admin/users/{id}/status        → AdminUser    (from `{ data }`)
 */

import { api } from "@/lib/api/api-client"
import {
  normalizeAdminUser,
  type RawAdminUser,
} from "@/lib/utils/user/normalize"
import type { AdminUser, AdminUserFilters } from "@/types/admin-user"
import type { UserStatus } from "@/types/user"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

export const adminUserService = {
  /** List users, optionally filtered by role/status (e.g. pending approvals). */
  async list(filters: AdminUserFilters = {}): Promise<AdminUser[]> {
    const res = await api.get<Envelope<RawAdminUser[]>>("/admin/users", {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    })
    // Backend enum fields may arrive by name ("OFFICER") or value ("Officer").
    return (res.data ?? []).map(normalizeAdminUser)
  },

  /** Change a user's status (approve → "Active", reject → "Rejected"). */
  async updateStatus(id: string, status: UserStatus): Promise<AdminUser> {
    const res = await api.patch<Envelope<RawAdminUser>>(
      `/admin/users/${id}/status`,
      { status },
    )
    return normalizeAdminUser(res.data)
  },
}
