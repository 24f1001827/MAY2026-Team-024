/**
 * lib/utils/complaint/display.ts
 *
 * Presentation helpers for complaints — human labels, status "phase" grouping,
 * badge colors, and marker pin colors. Shared by the map dashboard.
 */

import type {
  ComplaintPriority,
  ComplaintStatus,
} from "@/types/complaint"

// ---------------------------------------------------------------------------
// Status → phase grouping (11 granular statuses collapse into 3 stages)
// ---------------------------------------------------------------------------

export type ComplaintPhase = "open" | "in-progress" | "resolved"

const STATUS_PHASE: Record<ComplaintStatus, ComplaintPhase> = {
  Submitted: "open",
  Assigned: "open",
  UnderReview: "open",
  ReportSubmitted: "open",
  Reopened: "open",
  AwaitingBudget: "in-progress",
  BudgetAllocated: "in-progress",
  TenderNotificationIssued: "in-progress",
  TenderAllotted: "in-progress",
  WorkInProgress: "in-progress",
  WorkCompleted: "in-progress",
  Resolved: "resolved",
  Closed: "resolved",
}

/**
 * Phase for a status. Falls back to "open" for any value not in the map so a
 * new backend status can never crash the map/badge rendering (the enum has
 * drifted before — see WorkCompleted/Reopened).
 */
export function statusPhase(status: ComplaintStatus): ComplaintPhase {
  return STATUS_PHASE[status] ?? "open"
}

export const PHASE_META: Record<
  ComplaintPhase,
  { label: string; badge: string }
> = {
  open: {
    label: "Open",
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  },
  "in-progress": {
    label: "In progress",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400 ring-sky-500/20",
  },
  resolved: {
    label: "Resolved",
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  },
}

export const PHASE_ORDER: ComplaintPhase[] = ["open", "in-progress", "resolved"]

// ---------------------------------------------------------------------------
// Human-readable status labels
// ---------------------------------------------------------------------------

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  Submitted: "Submitted",
  Assigned: "Assigned",
  UnderReview: "Under review",
  ReportSubmitted: "Report submitted",
  AwaitingBudget: "Awaiting budget",
  BudgetAllocated: "Budget allocated",
  TenderNotificationIssued: "Tender issued",
  TenderAllotted: "Tender allotted",
  WorkInProgress: "Work in progress",
  WorkCompleted: "Work completed",
  Resolved: "Resolved",
  Reopened: "Reopened",
  Closed: "Closed",
}

export function statusLabel(status: ComplaintStatus): string {
  return STATUS_LABEL[status] ?? status
}

export function statusBadgeClass(status: ComplaintStatus): string {
  return PHASE_META[statusPhase(status)].badge
}

// ---------------------------------------------------------------------------
// Priority — badge dot + map pin color
// ---------------------------------------------------------------------------

export const PRIORITY_META: Record<
  ComplaintPriority,
  { label: string; dot: string; pin: string; pinBorder: string }
> = {
  Low: { label: "Low", dot: "bg-blue-500", pin: "#3b82f6", pinBorder: "#1d4ed8" },
  Medium: {
    label: "Medium",
    dot: "bg-amber-500",
    pin: "#f59e0b",
    pinBorder: "#b45309",
  },
  High: {
    label: "High",
    dot: "bg-orange-500",
    pin: "#f97316",
    pinBorder: "#c2410c",
  },
  Critical: {
    label: "Critical",
    dot: "bg-red-500",
    pin: "#ef4444",
    pinBorder: "#b91c1c",
  },
}

export const PRIORITY_ORDER: ComplaintPriority[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
]

// ---------------------------------------------------------------------------
// Misc formatting
// ---------------------------------------------------------------------------

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  })
}
