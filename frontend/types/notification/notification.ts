/**
 * `notifications` entity — mirrors the `notifications` table and the backend
 * `NotificationType` enum (values, not names).
 */

export type NotificationType =
  | "ComplaintCreated"
  | "ComplaintAssigned"
  | "AssignmentAccepted"
  | "AssignmentRejected"
  | "ReviewCompleted"
  | "BudgetRequested"
  | "BudgetAllocated"
  | "StatusChange"
  | "TenderPublished"
  | "TenderAlloted"
  | "WorkOrderCreated"
  | "WorkOrderUpdated"
  | "SLABreach"
  | "ComplaintResolved"
  | "ComplaintClosure"

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  /** ISO timestamp, or null while unread. */
  readAt: string | null
  /** ISO timestamp. */
  createdAt: string
}
