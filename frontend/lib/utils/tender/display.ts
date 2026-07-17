/**
 * lib/utils/tender/display.ts
 *
 * Presentation helpers for tender status.
 */

import type { TenderStatus } from "@/types/tender"

export const TENDER_STATUS_META: Record<
  TenderStatus,
  { label: string; badge: string }
> = {
  Draft: {
    label: "Draft",
    badge: "bg-muted text-muted-foreground ring-border",
  },
  Open: {
    label: "Open",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400 ring-sky-500/20",
  },
  Closed: {
    label: "Closed",
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  },
  Awarded: {
    label: "Awarded",
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  },
  Cancelled: {
    label: "Cancelled",
    badge: "bg-red-500/15 text-red-700 dark:text-red-400 ring-red-500/20",
  },
}
