/**
 * nav/metadata/officers.meta.ts
 *
 * Metadata for the officers module — managing officers and their
 * department assignments.
 */

import { ShieldUserIcon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { ADMIN_ONLY, OPEN_ACCESS } from "../access/roles"

export const officersMetadata: MetadataRegistry = {
  officers: {
    label: "Officers",
    icon: ShieldUserIcon,
    // Read-only officer directory — visible to any authenticated user. The
    // create/detail/edit routes below stay admin-only.
    description: "Officers across departments and their availability.",
    order: 50,
    access: OPEN_ACCESS,
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
