import {
  mockComplaintRemarks,
  mockComplaints,
  mockDepartments,
} from "@/components/shared/mock-data"
import type { Complaint, ComplaintRemark } from "@/types/complaint"
import type { Department } from "@/types/department"
import type { ComplaintMapItem } from "@/features/dashboard/components/types"

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

/** Strip reporter identity so nothing links a complaint back to a citizen. */
function anonymize(complaint: Complaint): Complaint {
  return { ...complaint, citizenId: "" }
}

/**
 * All complaints for the public map, enriched and anonymized. Backed by mock
 * data today; swap the source here (API/DB) without touching the consumers.
 */
export function getPublicComplaints(): ComplaintMapItem[] {
  return enrichComplaints(mockComplaints.map(anonymize), mockDepartments)
}

/** A single anonymized complaint plus its activity, or `null` if not found. */
export function getPublicComplaint(id: string): {
  complaint: Complaint
  departmentName: string
  remarks: ComplaintRemark[]
} | null {
  const complaint = mockComplaints.find((c) => c.id === id)
  if (!complaint) return null

  const department = mockDepartments.find((d) => d.id === complaint.departmentId)
  const remarks = mockComplaintRemarks.filter((r) => r.complaintId === id)

  return {
    complaint: anonymize(complaint),
    departmentName: department?.name ?? "Unassigned",
    remarks,
  }
}
