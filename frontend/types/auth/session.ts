import type { UserRole, UserStatus } from "@/types/user"

/**
 * The subset of the user we persist in the session cookie and hand back to the
 * client on login. Client-safe (no server-only imports) so both the browser
 * hooks and the server session helpers can share it.
 */
export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
}
