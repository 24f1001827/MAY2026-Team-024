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
  normalizeAdminUsers,
  type RawAdminUser,
} from "@/lib/utils/user/normalize"
import type { AdminUser, AdminUserFilters } from "@/types/admin-user"
import type { UserStatus } from "@/types/user"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

/**
 * A mutation response is the specific row the admin just acted on, so an
 * unclassifiable one is an error rather than something to silently drop.
 */
function requireUser(raw: RawAdminUser): AdminUser {
  const user = normalizeAdminUser(raw)
  if (!user) {
    throw new Error(
      `Server returned a user with an unrecognized role/status (id=${raw.id}).`,
    )
  }
  return user
}

export const adminUserService = {
  /** List users, optionally filtered by role/status (e.g. pending approvals). */
  async list(filters: AdminUserFilters = {}): Promise<AdminUser[]> {
    const res = await api.get<Envelope<RawAdminUser[]>>("/admin/users", {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    })
    // Backend enum fields may arrive by name ("OFFICER") or value ("Officer");
    // rows with an unrecognized role/status are dropped rather than rendered.
    return normalizeAdminUsers(res.data ?? [])
  },

  /** Change a user's status (approve → "Active", reject → "Rejected"). */
  async updateStatus(id: string, status: UserStatus): Promise<AdminUser> {
    const res = await api.patch<Envelope<RawAdminUser>>(
      `/admin/users/${id}/status`,
      { status },
    )
    return requireUser(res.data)
  },

  /** Set an officer's maximum workload (capacity). */
  async updateMaxWorkload(id: string, maxWorkload: number): Promise<AdminUser> {
    const res = await api.patch<Envelope<RawAdminUser>>(
      `/admin/users/${id}/max-workload`,
      { max_workload: maxWorkload },
    )
    return requireUser(res.data)
  },
}
