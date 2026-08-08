/**
 * lib/utils/notification/display.ts
 *
 * Presentation helpers for notification types — an icon per type, with a
 * fallback so an unrecognized type (backend drift) still renders sanely.
 */

import type { IconSvgElement } from "@hugeicons/react"
import {
  Agreement02Icon,
  Alert02Icon,
  CheckmarkBadge02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Megaphone01Icon,
  Notification01Icon,
  PackageIcon,
  RefreshIcon,
  Task01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"

import type { NotificationType } from "@/types/notification"

export const NOTIFICATION_ICON: Record<NotificationType, IconSvgElement> = {
  ComplaintCreated: Megaphone01Icon,
  ComplaintAssigned: Task01Icon,
  AssignmentAccepted: CheckmarkBadge02Icon,
  AssignmentRejected: Cancel01Icon,
  ReviewCompleted: CheckmarkBadge02Icon,
  BudgetRequested: Wallet01Icon,
  BudgetAllocated: Wallet01Icon,
  StatusChange: RefreshIcon,
  TenderPublished: Agreement02Icon,
  TenderAlloted: Agreement02Icon,
  WorkOrderCreated: PackageIcon,
  WorkOrderUpdated: PackageIcon,
  SLABreach: Alert02Icon,
  ComplaintResolved: CheckmarkCircle02Icon,
  ComplaintClosure: CheckmarkCircle02Icon,
}

/** Icon for a notification type, falling back to a generic bell. */
export function notificationIcon(type: NotificationType): IconSvgElement {
  return NOTIFICATION_ICON[type] ?? Notification01Icon
}
