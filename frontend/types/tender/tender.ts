/**
 * `tenders` entity — mirrors the `tenders` table in the schema diagram.
 */

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
