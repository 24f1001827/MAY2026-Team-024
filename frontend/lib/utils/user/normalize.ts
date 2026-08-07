/**
 * lib/utils/user/normalize.ts
 *
 * The admin user endpoints serialize role/status via marshmallow `EnumField`
 * *by name* (e.g. "OFFICER", "PENDING_APPROVAL"), whereas the rest of the API
 * (auth/login, complaints) uses the enum *value* ("Officer", "Active"). These
 * helpers normalize either form to the frontend's canonical union so the UI
 * never sees an unexpected key. Type-only imports → runtime-dependency-free.
 */

import type { UserRole, UserStatus } from "@/types/user"
import type { AdminUser } from "@/types/admin-user"

// Accept both the enum NAME (backend `EnumField` default) and the VALUE.
const ROLE_BY_KEY: Record<string, UserRole> = {
  CITIZEN: "Citizen",
  OFFICER: "Officer",
  ADMIN: "Admin",
  AGENCY: "Agency",
  Citizen: "Citizen",
  Officer: "Officer",
  Admin: "Admin",
  Agency: "Agency",
}

const STATUS_BY_KEY: Record<string, UserStatus> = {
  PENDING_APPROVAL: "PendingApproval",
  ACTIVE: "Active",
  REJECTED: "Rejected",
  BLOCKED: "Blocked",
  PendingApproval: "PendingApproval",
  Active: "Active",
  Rejected: "Rejected",
  Blocked: "Blocked",
}

/**
 * Null when `raw` matches no known role — callers decide how to fail. Casting
 * the unknown string through instead (the previous behaviour) typechecked but
 * produced a value outside the union, so every `role === "Officer"` comparison
 * downstream silently went false.
 */
export function normalizeRole(raw: string): UserRole | null {
  return ROLE_BY_KEY[raw] ?? null
}

/** Null when `raw` matches no known status. See `normalizeRole`. */
export function normalizeStatus(raw: string): UserStatus | null {
  return STATUS_BY_KEY[raw] ?? null
}

/** Raw user row as it arrives from the backend (enum fields still strings). */
export interface RawAdminUser {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
  status: string
  current_workload?: number | null
  max_workload?: number | null
}

/**
 * Null when the row's role/status fall outside the known enums — such a row
 * can't be role-gated or acted on correctly. Callers listing users should drop
 * these (see `normalizeAdminUsers`); callers resolving one specific user should
 * treat null as an error.
 */
export function normalizeAdminUser(raw: RawAdminUser): AdminUser | null {
  const role = normalizeRole(raw.role)
  const status = normalizeStatus(raw.status)

  if (!role || !status) {
    console.error(
      `[admin-user] dropping unclassifiable row (id=${raw.id}): ` +
        `role=${JSON.stringify(raw.role)}, status=${JSON.stringify(raw.status)}`,
    )
    return null
  }

  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone ?? "",
    role,
    status,
    currentWorkload: raw.current_workload ?? null,
    maxWorkload: raw.max_workload ?? null,
  }
}

/**
 * Normalize a list of user rows, dropping any the frontend can't classify so a
 * single malformed row doesn't take out the whole listing.
 */
export function normalizeAdminUsers(raws: RawAdminUser[]): AdminUser[] {
  return raws
    .map(normalizeAdminUser)
    .filter((user): user is AdminUser => user !== null)
}
