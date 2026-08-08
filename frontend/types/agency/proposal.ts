/**
 * `proposals` entity — an agency's bid against a tender. Mirrors the
 * `proposals` table. Decimal `proposalAmount` arrives from the backend as a
 * string and is parsed to a number in the service.
 */

export type ProposalStatus =
  | "Submitted"
  | "Shortlisted"
  | "Accepted"
  | "Rejected"

export const PROPOSAL_STATUSES: readonly ProposalStatus[] = [
  "Submitted",
  "Shortlisted",
  "Accepted",
  "Rejected",
]

/**
 * A proposal as seen by the submitting agency. `agencyId` is present on the
 * submit response but absent from the list rows; `createdAt` is present on the
 * list rows but absent from the submit response — hence both optional.
 */
export interface AgencyProposal {
  proposalId: number
  tenderId: number
  agencyId?: string
  proposalAmount: number
  proposalDocument: string
  remarks: string | null
  status: ProposalStatus
  createdAt?: string
}
