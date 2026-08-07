/**
 * lib/utils/department/dashboard-normalize.ts
 *
 * Maps the backend `GET /officer/department/dashboard` payload to the
 * `DepartmentDashboardData` the UI consumes. Reuses the complaint and
 * department normalizers. Type-only imports → no runtime deps.
 */

import {
  normalizeComplaint,
  type RawComplaint,
} from "@/lib/utils/complaint/normalize"
import type {
  DepartmentDashboardData,
  DepartmentDashboardOfficer,
} from "@/types/department"
import type { AvailabilityStatus } from "@/types/officer"

/** A department's raw dashboard officer row. */
export interface RawDashboardOfficer {
  user_id: string
  name?: string | null
  email?: string | null
  availability_status?: string | null
  current_workload?: number | null
  max_workload?: number | null
  is_department_head?: boolean | null
}

/** The raw department block inside the dashboard payload. */
export interface RawDashboardDepartment {
  id: number
  name: string
  description?: string | null
  budget?: string | null
  head_officer_id?: string | null
}

/** The whole raw dashboard payload. */
export interface RawDepartmentDashboard {
  department: RawDashboardDepartment
  officers?: RawDashboardOfficer[] | null
  complaints?: RawComplaint[] | null
  is_department_head?: boolean | null
  manual_allotment?: boolean | null
}

function normalizeOfficer(
  raw: RawDashboardOfficer,
  headOfficerId: string | null,
): DepartmentDashboardOfficer {
  return {
    userId: raw.user_id,
    name: raw.name ?? "Unknown officer",
    availabilityStatus:
      (raw.availability_status as AvailabilityStatus | null) ?? "Available",
    currentWorkload: raw.current_workload ?? 0,
    maxWorkload: raw.max_workload ?? 0,
    // Prefer the officer's own flag; fall back to the department's head link.
    isHead: raw.is_department_head ?? raw.user_id === headOfficerId,
  }
}

export function normalizeDepartmentDashboard(
  raw: RawDepartmentDashboard,
): DepartmentDashboardData {
  const d = raw.department
  const headOfficerId = d.head_officer_id ?? null

  return {
    department: {
      id: d.id,
      name: d.name,
      description: d.description ?? "",
      budget: d.budget != null ? Number(d.budget) : 0,
      headOfficerId,
      createdAt: "",
      updatedAt: "",
    },
    officers: (raw.officers ?? []).map((o) =>
      normalizeOfficer(o, headOfficerId),
    ),
    complaints: (raw.complaints ?? []).map(normalizeComplaint),
    isDepartmentHead: Boolean(raw.is_department_head),
    // Default to manual (safer) if the field is absent.
    manualAllotment: raw.manual_allotment ?? true,
  }
}
