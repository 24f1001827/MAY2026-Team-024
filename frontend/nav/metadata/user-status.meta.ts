/**
 * nav/metadata/user-status.meta.ts
 *
 * Admin views of users grouped by account status — pending approval, rejected,
 * and blocked. Status governs sign-in (see AuthService.login), so these are the
 * admin's levers over who can access the platform.
 */

import {
  CancelCircleIcon,
  Clock01Icon,
  UserBlock01Icon,
} from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { ADMIN_ONLY } from "../access/roles"

// These pages remain routable (reached from the admin dashboard), but are
// hidden from the sidebar — the dashboard's tabs/filters are the entry point.
export const userStatusMetadata: MetadataRegistry = {
  "pending-approvals": {
    label: "Pending Approvals",
    breadcrumb: "Pending Approvals",
    icon: Clock01Icon,
    description: "Officer and agency registrations awaiting approval.",
    sidebarHidden: true,
    access: ADMIN_ONLY,
  },
  rejected: {
    label: "Rejected",
    breadcrumb: "Rejected",
    icon: CancelCircleIcon,
    description: "Registrations that were rejected.",
    sidebarHidden: true,
    access: ADMIN_ONLY,
  },
  blocked: {
    label: "Blocked",
    breadcrumb: "Blocked",
    icon: UserBlock01Icon,
    description: "Accounts blocked from signing in.",
    sidebarHidden: true,
    access: ADMIN_ONLY,
  },
}
