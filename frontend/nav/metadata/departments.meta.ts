/**
 * nav/metadata/departments.meta.ts
 *
 * Metadata for the departments module — the civic departments that
 * complaints are routed to.
 *
 * Two nav surfaces share this file:
 *   - `department` (singular, `/dashboard/department`) — an officer's landing.
 *   - `departments` (plural) — the admin CRUD area and its children.
 */

import { Building03Icon, OfficeIcon } from "@hugeicons/core-free-icons"

import type { MetadataRegistry } from "../types"
import { ADMIN_ONLY, STAFF_ONLY } from "../access/roles"

export const departmentsMetadata: MetadataRegistry = {
  department: {
    // Officer landing: heads see the full department dashboard, other officers
    // see a scoped read-only view of the complaints allotted to them.
    label: "Department",
    icon: Building03Icon,
    description: "Your department's complaint queue and assignments.",
    order: 35,
    access: { allowRoles: ["officer"] },
  },
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
    // The operational department dashboard. Admins reach any department;
    // an officer may reach it only if they head that department (enforced
    // per-record in the page). Hence STAFF_ONLY rather than ADMIN_ONLY.
    label: "Department",
    breadcrumb: "Details",
    access: STAFF_ONLY,
  },
  "departments-[id]-edit": {
    label: "Edit department",
    breadcrumb: "Edit",
    access: ADMIN_ONLY,
  },
}
