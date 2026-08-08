/**
 * `tenders` entity — mirrors the `tenders` table in the schema diagram.
 */

import type { WorkOrderStatus } from "@/types/agency"

export type TenderStatus =
  | "Draft"
  | "Open"
  | "Closed"
  | "Awarded"
  | "Cancelled"

export const TENDER_STATUSES: readonly TenderStatus[] = [
  "Draft",
  "Open",
  "Closed",
  "Awarded",
  "Cancelled",
]

export interface Tender {
  id: number
  complaintId: string // FK to complaints.id
  createdBy: string // FK to users.id
  title: string
  description: string
  estimatedCost: number
  closingDate: string
  status: TenderStatus
  createdAt: string
  updatedAt: string
}

/**
 * The tender an officer just created (`POST /officer/complaints/{id}/tender`).
 * Thinner than `Tender` — no `createdBy`/timestamps in the response DTO.
 */
export interface CreatedTender {
  id: number
  complaintId: string
  title: string
  description: string
  estimatedCost: number
  closingDate: string
  status: TenderStatus
}

/**
 * The awarded work order embedded under a complaint's tender summary — enough
 * for the reviewing officer to verify / mark-incomplete it.
 */
export interface ComplaintTenderWorkOrder {
  id: number
  status: WorkOrderStatus
  scopeOfWork: string
  completionProofUrl: string | null
}

/**
 * Compact tender summary embedded in a complaint's detail response — enough for
 * staff to see a complaint's tender state and jump to its proposals.
 */
export interface ComplaintTenderSummary {
  id: number
  title: string
  status: TenderStatus
  estimatedCost: number
  closingDate: string
  /** The awarded work order, or null until a proposal is awarded. */
  workOrder: ComplaintTenderWorkOrder | null
}
