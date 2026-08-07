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

export function normalizeRole(raw: string): UserRole {
  return ROLE_BY_KEY[raw] ?? (raw as UserRole)
}

export function normalizeStatus(raw: string): UserStatus {
  return STATUS_BY_KEY[raw] ?? (raw as UserStatus)
}

/** Raw user row as it arrives from the backend (enum fields still strings). */
export interface RawAdminUser {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
  status: string
}

export function normalizeAdminUser(raw: RawAdminUser): AdminUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone ?? "",
    role: normalizeRole(raw.role),
    status: normalizeStatus(raw.status),
  }
}
