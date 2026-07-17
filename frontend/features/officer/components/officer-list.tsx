import type { AvailabilityStatus } from "@/types/officer"

/**
 * Shared officer view-model used by the detail, edit, and form surfaces. The
 * officers index now renders `OfficersTable`; this file retains only the type
 * its other consumers import.
 */
export interface OfficerView {
  userId: string
  name: string
  email: string
  phone: string
  departmentName: string
  availabilityStatus: AvailabilityStatus
  currentWorkload: number
  maxWorkload: number
}
