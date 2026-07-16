/**
 * Core `users` entity — every actor in the system (Citizen, Officer, Admin,
 * Agency) is a row in this table, discriminated by `role`.
 * Mirrors the `users` table in the schema diagram.
 */

export type UserRole = "Citizen" | "Officer" | "Admin" | "Agency"

export type UserStatus = "PendingApproval" | "Active" | "Rejected" | "Blocked"

export const USER_ROLES = [
  "Citizen",
  "Officer",
  "Admin",
  "Agency",
] as const satisfies UserRole[]

export const USER_STATUSES = [
  "PendingApproval",
  "Active",
  "Rejected",
  "Blocked",
] as const satisfies UserStatus[]

export interface User {
  id: string // uuid
  name: string
  email: string
  phone: string
  /** Server-side only — never sent to the browser in real responses. */
  passwordHash?: string
  /** Auth provider, e.g. "local" | "google". */
  provider: string | null
  providerId: string | null
  role: UserRole
  status: UserStatus
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}
