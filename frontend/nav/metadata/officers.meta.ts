/**
 * nav/metadata/officers.meta.ts
 *
 * Metadata for the officers module — managing officers and their
 * department assignments.
 */

import { ShieldUserIcon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { ADMIN_ONLY } from "../access/roles"

export const officersMetadata: MetadataRegistry = {
  officers: {
    label: "Officers",
    icon: ShieldUserIcon,
    description: "Manage officers and their department assignments.",
    order: 50,
    access: ADMIN_ONLY,
  },
  "officers-create": {
    label: "New officer",
    breadcrumb: "New",
    sidebarHidden: true,
    access: ADMIN_ONLY,
  },
  "officers-[id]": {
    label: "Officer",
    breadcrumb: "Details",
    access: ADMIN_ONLY,
  },
  "officers-[id]-edit": {
    label: "Edit officer",
    breadcrumb: "Edit",
    access: ADMIN_ONLY,
  },
}
