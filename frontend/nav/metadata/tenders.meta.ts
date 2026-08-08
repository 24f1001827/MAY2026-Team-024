/**
 * nav/metadata/tenders.meta.ts
 *
 * Metadata for the tenders module. Officers oversee tenders they've published
 * (managed from the linked complaint); agencies browse open tenders and bid;
 * admins see every tender across departments (read-only). Citizens have none.
 */

import { Agreement02Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { AGENCY_ONLY, TENDER_ACCESS } from "../access/roles"

export const tendersMetadata: MetadataRegistry = {
  tenders: {
    label: "Tenders",
    icon: Agreement02Icon,
    description: "Publish tenders (from complaints) and let agencies bid.",
    order: 20,
    access: TENDER_ACCESS,
  },
  "tenders-[id]": {
    label: "Tender",
    breadcrumb: "Details",
    // Standalone tender detail is the agency bid page; officers use the
    // complaint detail instead.
    access: AGENCY_ONLY,
  },
}
