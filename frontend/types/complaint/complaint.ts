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
  | "TenderAlloted"
  | "WorkInProgress"
  | "Resolved"
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
  "TenderAlloted",
  "WorkInProgress",
  "Resolved",
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
  priority: ComplaintPriority
  status: ComplaintStatus
  latitude: number | null
  longitude: number | null
  address: string
  locality: string
  city: string
  state: string
  pincode: string
  aiCategory: string | null
  aiPriorityScore: number | null
  createdAt: string
  updatedAt: string
}

/** Payload for creating a complaint (citizen-authored fields only). */
export interface CreateComplaintInput {
  title: string
  description: string
  departmentId: number
  priority: ComplaintPriority
  address: string
  locality: string
  city: string
  state: string
  pincode: string
}
