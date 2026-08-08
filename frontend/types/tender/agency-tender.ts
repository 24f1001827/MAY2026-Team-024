/**
 * Agency-facing tender views. These are thinner than the full `Tender` entity:
 * the agency endpoints (`GET /agency/tenders`, `GET /agency/tenders/{id}`)
 * expose only the fields an agency needs to bid — no `createdBy`, no
 * `updatedAt`. Decimal `estimatedCost` arrives from the backend as a string and
 * is parsed to a number in the service.
 */

import type { TenderStatus } from "./tender"

/** Row from `GET /agency/tenders` (open tenders the agency can bid on). */
export interface AgencyTenderListItem {
  id: number
  complaintId: string
  title: string
  estimatedCost: number
  closingDate: string
  status: TenderStatus
}

/** Detail from `GET /agency/tenders/{id}` — adds description + createdAt. */
export interface AgencyTenderDetail extends AgencyTenderListItem {
  description: string
  createdAt: string
}

/**
 * Row from `GET /officer/tenders` — the officer's own tenders, with the linked
 * complaint title so they can jump to it (management lives on the complaint).
 */
export interface OfficerTenderListItem {
  id: number
  complaintId: string
  complaintTitle: string
  title: string
  status: TenderStatus
  estimatedCost: number
  closingDate: string
  createdAt: string
}
