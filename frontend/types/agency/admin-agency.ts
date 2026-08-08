import type { UserStatus } from "@/types/user"

/**
 * An agency as the admin directory sees it — the agency profile joined with its
 * owning user (name/email/phone/status). `id` is the shared user id.
 */
export interface AdminAgency {
  id: string
  name: string
  email: string
  phone: string
  status: UserStatus
  registrationNumber: string
  licenseNumber: string
  contactPerson: string
  currentProjects: number
  maxProjects: number
  createdAt: string
}
