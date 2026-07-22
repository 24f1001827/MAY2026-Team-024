import type { AvailabilityStatus } from "./officer"

/**
 * Payload collected by the officer create form. Flattens the `user`-side profile
 * (name / email / phone) together with the `officers` entity fields, so the form
 * has a single typed shape to POST once the backend lands.
 */
export interface CreateOfficerRequest {
  name: string
  email: string
  phone: string
  departmentId: number
  availabilityStatus: AvailabilityStatus
  maxWorkload: number
}
