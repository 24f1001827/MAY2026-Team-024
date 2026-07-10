/**
 * `officers` entity — a profile that extends a `user` (role "Officer") with
 * department assignment and workload tracking. `userId` is the shared PK/FK to
 * `users.id`. Mirrors the `officers` table in the schema diagram.
 */

export type AvailabilityStatus = "Available" | "Engaged" | "OnLeave"

export const AVAILABILITY_STATUSES: readonly AvailabilityStatus[] = [
  "Available",
  "Engaged",
  "OnLeave",
]

export interface Officer {
  userId: string // uuid — FK to users.id
  departmentId: number // FK to departments.id
  availabilityStatus: AvailabilityStatus
  currentWorkload: number
  maxWorkload: number
  createdAt: string
  updatedAt: string
}
