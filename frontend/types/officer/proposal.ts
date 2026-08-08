/**
 * Proposal views as seen by an officer reviewing bids on their tender. The list
 * endpoint (`GET /officer/tenders/{id}/proposals`) omits `tenderId`/`updatedAt`;
 * the detail endpoint (`GET /officer/proposals/{id}`) includes them — hence both
 * optional. `proposalAmount` arrives as a string and is parsed to a number.
 */

import type { ProposalStatus } from "@/types/agency"

export interface OfficerProposal {
  proposalId: number
  tenderId?: number
  agencyId: string
  /** Agency display name (from the joined user), or null if unavailable. */
  agencyName: string | null
  contactPerson: string | null
  proposalAmount: number
  proposalDocument: string
  remarks: string | null
  status: ProposalStatus
  createdAt: string
  updatedAt?: string
}
