/**
 * lib/utils/agency/display.ts
 *
 * Presentation helpers for proposal and work-order status, matching the badge
 * conventions in `lib/utils/tender/display.ts` (label + ring-styled chip).
 */

import type { ProposalStatus, WorkOrderStatus } from "@/types/agency"

export const PROPOSAL_STATUS_META: Record<
  ProposalStatus,
  { label: string; badge: string }
> = {
  Submitted: {
    label: "Submitted",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400 ring-sky-500/20",
  },
  Shortlisted: {
    label: "Shortlisted",
    badge:
      "bg-violet-500/15 text-violet-700 dark:text-violet-400 ring-violet-500/20",
  },
  Accepted: {
    label: "Accepted",
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  },
  Rejected: {
    label: "Rejected",
    badge: "bg-red-500/15 text-red-700 dark:text-red-400 ring-red-500/20",
  },
}

export const WORK_ORDER_STATUS_META: Record<
  WorkOrderStatus,
  { label: string; badge: string }
> = {
  Assigned: {
    label: "Assigned",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400 ring-sky-500/20",
  },
  InProgress: {
    label: "In progress",
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  },
  Incomplete: {
    label: "Incomplete",
    badge:
      "bg-orange-500/15 text-orange-700 dark:text-orange-400 ring-orange-500/20",
  },
  Completed: {
    label: "Completed",
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  },
  Verified: {
    label: "Verified",
    badge:
      "bg-teal-500/15 text-teal-700 dark:text-teal-400 ring-teal-500/20",
  },
  Closed: {
    label: "Closed",
    badge: "bg-muted text-muted-foreground ring-border",
  },
  Cancelled: {
    label: "Cancelled",
    badge: "bg-red-500/15 text-red-700 dark:text-red-400 ring-red-500/20",
  },
}
