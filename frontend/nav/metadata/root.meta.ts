/**
 * nav/metadata/root.meta.ts
 *
 * Metadata for the dashboard root (home) route.
 */

import { DashboardSquare01Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"

export const rootMetadata: MetadataRegistry = {
  dashboard: {
    label: "Dashboard",
    icon: DashboardSquare01Icon,
    description: "Your Rastro overview.",
    order: 0,
    // Officers are redirected from the home page to their department dashboard,
    // so the generic "Dashboard" item is redundant for them — hide it. Their
    // entry point is "Department" (`/dashboard/department`).
    access: { denyRoles: ["officer", "citizen"] },
  },
}
