/**
 * nav/metadata/root.meta.ts
 *
 * Metadata for the dashboard root (home) route.
 */

import { DashboardSquare01Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { OPEN_ACCESS } from "../access/roles"

export const rootMetadata: MetadataRegistry = {
  dashboard: {
    label: "Dashboard",
    icon: DashboardSquare01Icon,
    description: "Your Rastro overview.",
    order: 0,
    access: OPEN_ACCESS,
  },
}
