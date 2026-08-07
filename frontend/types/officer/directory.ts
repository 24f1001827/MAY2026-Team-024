import type { AvailabilityStatus } from "./officer"

/**
 * A privacy-safe officer directory entry (from `GET /api/officers`), visible to
 * any authenticated user. No contact info or workload — just who the officer is
 * and their department + availability.
 */
export interface OfficerDirectoryItem {
  userId: string
  name: string
  department: string
  availabilityStatus: AvailabilityStatus
}
