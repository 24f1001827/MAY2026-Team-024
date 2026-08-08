/**
 * nav/metadata/complaints.meta.ts
 *
 * Metadata for the complaints module. Citizens file and track, officers review
 * and act, admins oversee. Agencies have no role in complaints — they work off
 * tenders and work orders — so they're denied here.
 */

import { Megaphone01Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"

export const complaintsMetadata: MetadataRegistry = {
  complaints: {
    label: "Complaints",
    icon: Megaphone01Icon,
    description: "Raise, track, and resolve civic complaints.",
    order: 10,
    access: { denyRoles: ["agency"] },
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
    access: { denyRoles: ["agency"] },
  },
  "complaints-[id]-edit": {
    label: "Edit complaint",
    breadcrumb: "Edit",
    access: { allowRoles: ["citizen", "admin"] },
  },
}
