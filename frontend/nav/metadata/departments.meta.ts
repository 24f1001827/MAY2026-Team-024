/**
 * nav/metadata/departments.meta.ts
 *
 * Metadata for the departments module — the civic departments that
 * complaints are routed to.
 */

import { OfficeIcon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { ADMIN_ONLY } from "../access/roles"

export const departmentsMetadata: MetadataRegistry = {
  departments: {
    label: "Departments",
    icon: OfficeIcon,
    description: "Civic departments that complaints are routed to.",
    order: 40,
    access: ADMIN_ONLY,
  },
  "departments-create": {
    label: "New department",
    breadcrumb: "New",
    sidebarHidden: true,
    access: ADMIN_ONLY,
  },
  "departments-[id]": {
    label: "Department",
    breadcrumb: "Details",
    access: ADMIN_ONLY,
  },
  "departments-[id]-edit": {
    label: "Edit department",
    breadcrumb: "Edit",
    access: ADMIN_ONLY,
  },
}
