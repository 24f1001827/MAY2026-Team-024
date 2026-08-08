/**
 * Review report an officer submits after inspecting an assigned complaint. The
 * `decision` branches the lifecycle: TenderRequired → budget → tender flow;
 * Resolved/Closed short-circuit it.
 */

export type ReviewDecision = "Resolved" | "TenderRequired" | "Closed"

export const REVIEW_DECISIONS: readonly ReviewDecision[] = [
  "Resolved",
  "TenderRequired",
  "Closed",
]

export interface ReviewReport {
  complaintId: string
  findings: string
  estimatedCost: number | null
  estimatedDurationDays: number | null
  decision: ReviewDecision
  reviewDate: string
}

export interface CreateReviewReportInput {
  findings: string
  decision: ReviewDecision
  estimatedCost?: number
  estimatedDurationDays?: number
}
