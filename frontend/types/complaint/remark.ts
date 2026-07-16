import type { UserRole } from "@/types/user"
import type { ComplaintPriority, ComplaintStatus } from "./complaint"

/**
 * A remark / activity entry posted against a complaint. Officers and agencies
 * add these (optionally alongside a status change); admins and citizens see
 * the full trail.
 */
export interface ComplaintRemark {
  id: string
  complaintId: string
  authorId: string
  authorName: string
  authorRole: UserRole
  message: string
  /** Set together when the remark accompanied a status change. */
  statusFrom: ComplaintStatus | null
  statusTo: ComplaintStatus | null
  createdAt: string
}

/**
 * Editable complaint fields. Admins and citizens can update the whole record;
 * officers and agencies only post remarks / change status.
 */
export interface UpdateComplaintInput {
  title: string
  description: string
  departmentId: number
  priority: ComplaintPriority
  address: string
  locality: string
  city: string
  state: string
  pincode: string
}
