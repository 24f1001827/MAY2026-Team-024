/**
 * `complaints` entity — mirrors the `complaints` table in the schema diagram.
 */

export type ComplaintStatus =
  | "Submitted"
  | "Assigned"
  | "UnderReview"
  | "ReportSubmitted"
  | "AwaitingBudget"
  | "BudgetAllocated"
  | "TenderNotificationIssued"
  | "TenderAllotted"
  | "WorkInProgress"
  | "WorkCompleted"
  | "Resolved"
  | "Reopened"
  | "Closed"

export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical"

export const COMPLAINT_STATUSES: readonly ComplaintStatus[] = [
  "Submitted",
  "Assigned",
  "UnderReview",
  "ReportSubmitted",
  "AwaitingBudget",
  "BudgetAllocated",
  "TenderNotificationIssued",
  "TenderAllotted",
  "WorkInProgress",
  "WorkCompleted",
  "Resolved",
  "Reopened",
  "Closed",
]

export const COMPLAINT_PRIORITIES: readonly ComplaintPriority[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
]

export interface Complaint {
  id: string // uuid
  title: string
  description: string
  citizenId: string // FK to users.id
  departmentId: number // FK to departments.id
  /**
   * The officer (users.id / officers.userId) this complaint is allotted to, or
   * `null` while it waits in the department's unassigned queue.
   */
  assignedOfficerId: string | null
  priority: ComplaintPriority
  status: ComplaintStatus
  latitude: number | null
  longitude: number | null
  address: string
  locality: string
  city: string
  district: string
  state: string
  pincode: string
  country: string
  aiCategory: string | null
  aiPriorityScore: number | null
  clusterId: string | null
  isClusterPrimary: boolean
  clusterDisputed: boolean
  clusterReportCount: number
  /** Budget committed to this complaint, set on allocation; null until then. */
  allocatedBudget: number | null
  /** Financial year the budget was drawn from (e.g. "2026-27"). */
  budgetYear: string | null
  createdAt: string
  updatedAt: string
}
