/**
 * nav/metadata/agencies.meta.ts
 *
 * Metadata for the agencies module — a read-only admin directory of registered
 * agencies (agencies self-register; there is no admin create/edit backend).
 */

import { Building06Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { ADMIN_ONLY } from "../access/roles"

export const agenciesMetadata: MetadataRegistry = {
  agencies: {
    label: "Agencies",
    icon: Building06Icon,
    description: "Registered agencies that execute awarded work orders.",
    order: 30,
    access: ADMIN_ONLY,
  },
  "agencies-[id]": {
    label: "Agency",
    breadcrumb: "Details",
    access: ADMIN_ONLY,
  },
}
