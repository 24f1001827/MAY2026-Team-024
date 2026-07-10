/**
 * `notifications` entity — mirrors the `notifications` table in the diagram.
 */

export type NotificationType =
  | "StatusChange"
  | "Assignment"
  | "InspectionDone"
  | "TenderPublished"
  | "SLABreach"
  | "BudgetPending"
  | "Closure"

export interface Notification {
  id: number
  userId: string // FK to users.id
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}
