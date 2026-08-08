/**
 * nav/metadata/budgets.meta.ts
 *
 * Metadata for the admin budgets module — year-wise department budgets and
 * their utilization.
 */

import { Wallet01Icon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { ADMIN_ONLY } from "../access/roles"

export const budgetsMetadata: MetadataRegistry = {
  budgets: {
    label: "Budgets",
    icon: Wallet01Icon,
    description: "Year-wise department budgets and utilization.",
    order: 35,
    access: ADMIN_ONLY,
  },
  "budgets-[id]": {
    label: "Department budget",
    breadcrumb: "Details",
    access: ADMIN_ONLY,
  },
}
