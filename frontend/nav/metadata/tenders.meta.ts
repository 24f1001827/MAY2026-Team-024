/**
 * nav/metadata/tenders.meta.ts
 *
 * Metadata for the tenders module. Admins publish, officers manage,
 * agencies bid — citizens have no access.
 */

import { Agreement02Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { STAFF_ONLY, TENDER_ACCESS } from "../access/roles"

export const tendersMetadata: MetadataRegistry = {
  tenders: {
    label: "Tenders",
    icon: Agreement02Icon,
    description: "Publish, bid on, and award work orders to agencies.",
    order: 20,
    access: TENDER_ACCESS,
  },
  "tenders-create": {
    label: "New tender",
    breadcrumb: "New",
    sidebarHidden: true,
    // Officers and admins publish tenders; agencies only bid.
    access: STAFF_ONLY,
  },
  "tenders-[id]": {
    label: "Tender",
    breadcrumb: "Details",
    access: TENDER_ACCESS,
  },
  "tenders-[id]-edit": {
    label: "Edit tender",
    breadcrumb: "Edit",
    access: STAFF_ONLY,
  },
}
