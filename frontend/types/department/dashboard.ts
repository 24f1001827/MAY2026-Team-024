import type { AvailabilityStatus } from "@/types/officer"
import type { Complaint } from "@/types/complaint"
import type { Department } from "./department"

/** An officer within a department, as the dashboard consumes them. */
export interface DepartmentDashboardOfficer {
  userId: string
  name: string
  availabilityStatus: AvailabilityStatus
  currentWorkload: number
  maxWorkload: number
  isHead: boolean
}

/**
 * The officer/admin department dashboard payload (from
 * `GET /officer/department/dashboard`), normalized: the department, its
 * officers, its complaints, and whether the viewer heads the department.
 */
export interface DepartmentDashboardData {
  department: Department
  officers: DepartmentDashboardOfficer[]
  complaints: Complaint[]
  isDepartmentHead: boolean
  /** Org-wide setting: when true, complaints queue for manual allotment. */
  manualAllotment: boolean
}
