/**
 * nav/metadata/officers.meta.ts
 *
 * Metadata for the officers module — a read-only directory of officers and
 * their availability. Officers self-register and are approved by an admin
 * (there is no admin create/edit backend), so the module is a single route.
 * Capacity is managed from the admin users table.
 */

import { ShieldUserIcon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { OPEN_ACCESS } from "../access/roles"

export const officersMetadata: MetadataRegistry = {
  officers: {
    label: "Officers",
    icon: ShieldUserIcon,
    // Read-only officer directory — visible to any authenticated user.
    description: "Officers across departments and their availability.",
    order: 50,
    access: OPEN_ACCESS,
  },
}
