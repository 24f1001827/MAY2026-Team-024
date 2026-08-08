/**
 * nav/metadata/work-orders.meta.ts
 *
 * Metadata for the agency "Work orders" module — awarded contracts the agency
 * executes and reports progress on. Agency-only.
 */

import { PackageIcon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { AGENCY_ONLY } from "../access/roles"

export const workOrdersMetadata: MetadataRegistry = {
  "work-orders": {
    label: "Work Orders",
    icon: PackageIcon,
    description: "Awarded contracts to execute and report progress on.",
    order: 24,
    access: AGENCY_ONLY,
  },
  "work-orders-[id]": {
    label: "Work order",
    breadcrumb: "Details",
    access: AGENCY_ONLY,
  },
}
