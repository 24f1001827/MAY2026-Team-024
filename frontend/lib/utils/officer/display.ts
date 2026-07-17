/**
 * lib/utils/officer/display.ts
 *
 * Presentation helpers for officer availability.
 */

import type { AvailabilityStatus } from "@/types/officer"

export const AVAILABILITY_META: Record<
  AvailabilityStatus,
  { label: string; badge: string }
> = {
  Available: {
    label: "Available",
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  },
  Engaged: {
    label: "Engaged",
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  },
  OnLeave: {
    label: "On leave",
    badge:
      "bg-muted text-muted-foreground ring-border",
  },
}
