/**
 * nav/access/roles.ts
 *
 * Role and permission type definitions for the navigation access control system.
 * Roles mirror the domain `UserRole` (lower-cased for access keys).
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export type Role = "citizen" | "officer" | "admin" | "agency"

export const ROLES = [
  "citizen",
  "officer",
  "admin",
  "agency",
] as const satisfies Role[]

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export type Permission =
  | "complaints:view"
  | "complaints:manage"
  | "complaints:assign"
  | "reports:submit"
  | "tenders:view"
  | "tenders:manage"
  | "proposals:submit"
  | "work-orders:view"
  | "work-orders:manage"
  | "departments:manage"
  | "officers:manage"
  | "agencies:manage"
  | "users:manage"
  | "settings:view"
  | "settings:manage"

// ---------------------------------------------------------------------------
// Access config
// ---------------------------------------------------------------------------

export interface AccessConfig {
  /**
   * Roles explicitly allowed. If empty or undefined, all authenticated
   * users are allowed (subject to denyRoles).
   */
  allowRoles?: Role[]

  /** Roles explicitly denied. Takes precedence over allowRoles. */
  denyRoles?: Role[]

  /** All listed permissions must be satisfied. */
  permissions?: Permission[]

  /** Requires authentication but no specific role. Defaults to true for all nav items. */
  requireAuth?: boolean
}

/** Open-access config constant (no restrictions). */
export const OPEN_ACCESS: AccessConfig = {} as const

/** Admin-only access config constant. */
export const ADMIN_ONLY: AccessConfig = { allowRoles: ["admin"] } as const

/** Internal staff (officers + admins). */
export const STAFF_ONLY: AccessConfig = {
  allowRoles: ["admin", "officer"],
} as const

/** Tender participants (admins publish, officers manage, agencies bid). */
export const TENDER_ACCESS: AccessConfig = {
  allowRoles: ["admin", "officer", "agency"],
} as const

/** Agency-only — the contractor portal (my proposals, work orders). */
export const AGENCY_ONLY: AccessConfig = { allowRoles: ["agency"] } as const

/** Officers + agencies — the tenders list (officers oversee, agencies bid). */
export const OFFICER_AGENCY_ACCESS: AccessConfig = {
  allowRoles: ["officer", "agency"],
} as const
