/**
 * lib/utils/user/display.ts
 *
 * Presentation helpers for user role + account status (admin user management).
 */

import {
  Building03Icon,
  ShieldUserIcon,
  UserIcon,
  UserStar01Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import type { UserRole, UserStatus } from "@/types/user"

export const USER_STATUS_META: Record<
  UserStatus,
  { label: string; badge: string }
> = {
  Active: {
    label: "Active",
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  },
  PendingApproval: {
    label: "Pending",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  },
  Rejected: {
    label: "Rejected",
    badge:
      "bg-destructive/10 text-destructive ring-destructive/20 dark:bg-destructive/20",
  },
  Blocked: {
    label: "Blocked",
    badge: "bg-muted text-muted-foreground ring-border",
  },
}

export const ROLE_META: Record<
  UserRole,
  { label: string; icon: IconSvgElement; badge: string }
> = {
  Admin: {
    label: "Admin",
    icon: UserStar01Icon,
    badge: "bg-brand/10 text-brand ring-brand/20",
  },
  Officer: {
    label: "Officer",
    icon: ShieldUserIcon,
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400 ring-sky-500/20",
  },
  Agency: {
    label: "Agency",
    icon: Building03Icon,
    badge:
      "bg-violet-500/15 text-violet-700 dark:text-violet-400 ring-violet-500/20",
  },
  Citizen: {
    label: "Citizen",
    icon: UserIcon,
    badge: "bg-muted text-muted-foreground ring-border",
  },
}

const NEUTRAL_BADGE = "bg-muted text-muted-foreground ring-border"

/** Role badge meta with a safe fallback for unexpected values (never throws). */
export function getRoleMeta(role: string) {
  return (
    ROLE_META[role as UserRole] ?? {
      label: role || "Unknown",
      icon: UserIcon,
      badge: NEUTRAL_BADGE,
    }
  )
}

/** Status badge meta with a safe fallback for unexpected values (never throws). */
export function getStatusMeta(status: string) {
  return (
    USER_STATUS_META[status as UserStatus] ?? {
      label: status || "Unknown",
      badge: NEUTRAL_BADGE,
    }
  )
}
