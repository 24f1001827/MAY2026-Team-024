import type { UserRole, UserStatus } from "@/types/user"

/**
 * A user row as returned by the admin user-management endpoints
 * (`UserResponseSchema` on the backend). Deliberately lean — this is all the
 * admin list/approval screens need.
 */
export interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
}

/** Optional filters for the admin user list (mirrors the backend query params). */
export interface AdminUserFilters {
  role?: UserRole
  status?: UserStatus
}
