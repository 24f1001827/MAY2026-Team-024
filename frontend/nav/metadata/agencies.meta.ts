/**
 * nav/metadata/agencies.meta.ts
 *
 * Metadata for the agencies module — the directory of registered agencies
 * that bid on and execute awarded work orders.
 */

import { Building06Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { STAFF_ONLY } from "../access/roles"

export const agenciesMetadata: MetadataRegistry = {
  agencies: {
    label: "Agencies",
    icon: Building06Icon,
    description: "Registered agencies that execute awarded work orders.",
    order: 30,
    access: STAFF_ONLY,
  },
  "agencies-create": {
    label: "New agency",
    breadcrumb: "New",
    sidebarHidden: true,
    access: STAFF_ONLY,
  },
  "agencies-[id]": {
    label: "Agency",
    breadcrumb: "Details",
    access: STAFF_ONLY,
  },
  "agencies-[id]-edit": {
    label: "Edit agency",
    breadcrumb: "Edit",
    access: STAFF_ONLY,
  },
}
