/**
 * nav/metadata/complaints.meta.ts
 *
 * Metadata for the complaints module. Open to all authenticated users:
 * citizens file and track, officers review and act.
 */

import { Megaphone01Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { OPEN_ACCESS } from "../access/roles"

export const complaintsMetadata: MetadataRegistry = {
  complaints: {
    label: "Complaints",
    icon: Megaphone01Icon,
    description: "Raise, track, and resolve civic complaints.",
    order: 10,
    access: OPEN_ACCESS,
  },
  "complaints-new": {
    label: "File a complaint",
    breadcrumb: "New",
    // Action page — reached via a button, not a sidebar item.
    sidebarHidden: true,
    access: { allowRoles: ["citizen", "admin"] },
  },
  "complaints-[id]": {
    label: "Complaint",
    breadcrumb: "Details",
  },
}
