import type { UserRole } from "./user"

/**
 * Roles are represented in the schema by the `UserRole` enum (there is no
 * separate `roles` table). This descriptor gives each role a human-readable
 * label and description for use in UI (role pickers, badges, admin screens).
 */
export interface Role {
  key: UserRole
  label: string
  description: string
}
