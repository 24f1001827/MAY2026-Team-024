/**
 * services/officer-service.ts
 *
 * Officer-scoped operations that hit the officer API through this app's route
 * handlers (Bearer forwarded server-side). Currently: the department dashboard
 * (department + officers + complaints) and complaint allotment (head-only,
 * enforced by the backend).
 */

import { api } from "@/lib/api/api-client"
import {
  normalizeDepartmentDashboard,
  type RawDepartmentDashboard,
} from "@/lib/utils/department/dashboard-normalize"
import type { DepartmentDashboardData } from "@/types/department"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

export const officerService = {
  /** The logged-in officer's department dashboard (department + officers + complaints). */
  async getDepartmentDashboard(): Promise<DepartmentDashboardData> {
    const res = await api.get<Envelope<RawDepartmentDashboard>>(
      "/officer/department/dashboard",
    )
    return normalizeDepartmentDashboard(res.data)
  },

  /** Head-only: allot a complaint to an officer in the department. */
  async allotComplaint(
    complaintId: string,
    officerId: string,
    assignmentNote?: string,
  ): Promise<void> {
    await api.post(`/officer/complaints/${complaintId}/allot`, {
      officer_id: officerId,
      ...(assignmentNote ? { assignment_note: assignmentNote } : {}),
    })
  },

  /** The assigned officer accepts their pending assignment. */
  async acceptAssignment(complaintId: string): Promise<void> {
    await api.patch(`/officer/complaints/${complaintId}/accept`, {})
  },

  /** The assigned officer rejects their pending assignment. */
  async rejectAssignment(complaintId: string): Promise<void> {
    await api.patch(`/officer/complaints/${complaintId}/reject`, {})
  },
}
