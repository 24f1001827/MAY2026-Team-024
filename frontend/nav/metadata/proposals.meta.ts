/**
 * nav/metadata/proposals.meta.ts
 *
 * Metadata for the agency "My proposals" module — the bids an agency has
 * submitted on tenders. Agency-only.
 */

import { DocumentAttachmentIcon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { AGENCY_ONLY } from "../access/roles"

export const proposalsMetadata: MetadataRegistry = {
  proposals: {
    label: "My Proposals",
    icon: DocumentAttachmentIcon,
    description: "Bids you’ve submitted on tenders and their status.",
    order: 22,
    access: AGENCY_ONLY,
  },
}
