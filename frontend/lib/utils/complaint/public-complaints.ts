import type { Complaint } from "@/types/complaint"
import type { Department } from "@/types/department"
import type { ComplaintMapItem } from "@/features/dashboard/components/types"

/**
 * Pure, client-safe helpers for public complaint surfaces. The actual data
 * fetching (server-only, unauthenticated) lives in `lib/api/public-complaints.ts`
 * — keep this file free of server imports since client components
 * (`complaints-view.tsx`) import `enrichComplaints` from here.
 */

/**
 * Label shown wherever a complaint's reporter would appear on a public surface.
 * Public views never expose who filed a complaint.
 */
export const ANONYMOUS_REPORTER = "Anonymous"

/** Enrich complaints with their department name for the map/list views. */
export function enrichComplaints(
  complaints: Complaint[],
  departments: Pick<Department, "id" | "name">[]
): ComplaintMapItem[] {
  const deptName = new Map(departments.map((d) => [d.id, d.name]))
  return complaints.map((complaint) => ({
    ...complaint,
    departmentName: deptName.get(complaint.departmentId) ?? "Unassigned",
  }))
}
