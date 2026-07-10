/**
 * nav/metadata/settings.meta.ts
 *
 * Metadata for the settings module — account and preferences. Available to
 * every authenticated user.
 */

import { Settings01Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { OPEN_ACCESS } from "../access/roles"

export const settingsMetadata: MetadataRegistry = {
  settings: {
    label: "Settings",
    icon: Settings01Icon,
    description: "Manage your account and preferences.",
    order: 90,
    access: OPEN_ACCESS,
  },
}
