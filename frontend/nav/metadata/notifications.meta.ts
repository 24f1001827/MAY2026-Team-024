/**
 * nav/metadata/notifications.meta.ts
 *
 * Metadata for the notifications module — updates on complaints, tenders,
 * and work orders. Available to every authenticated user.
 */

import { Notification01Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { OPEN_ACCESS } from "../access/roles"

export const notificationsMetadata: MetadataRegistry = {
  notifications: {
    label: "Notifications",
    icon: Notification01Icon,
    description: "Updates on your complaints, tenders, and work orders.",
    order: 60,
    access: OPEN_ACCESS,
  },
}
