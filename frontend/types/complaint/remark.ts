import type { UserRole } from "@/types/user"
import type { ComplaintStatus } from "./complaint"

/**
 * A remark / activity entry posted against a complaint. Officers and agencies
 * add these (optionally alongside a status change); admins and citizens see
 * the full trail.
 */
export interface ComplaintRemark {
  id: string
  complaintId: string
  /** Null for system-generated entries, and on the anonymized public timeline. */
  authorId: string | null
  authorName: string
  /** Null for system-generated entries (auto-assignment, auto transitions). */
  authorRole: UserRole | null
  message: string
  /** Set together when the remark accompanied a status change. */
  statusFrom: ComplaintStatus | null
  statusTo: ComplaintStatus | null
  createdAt: string
}
