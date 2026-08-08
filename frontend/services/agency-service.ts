/**
 * services/agency-service.ts
 *
 * Agency-portal operations, hit through this app's `/api/agency/*` route
 * handlers (Bearer forwarded server-side). All endpoints are `role_required
 * (AGENCY)` on the backend.
 *
 * Endpoint audit (backend contract → classification):
 *   GET   /agency/tenders                     → TenderListSchema[]      (list)
 *   GET   /agency/tenders/{id}                → TenderDetailSchema      (full)
 *   POST  /agency/tenders/{id}/proposal       → ProposalResponseSchema  (full, multipart)
 *   GET   /agency/proposals                   → AgencyProposalListSchema[] (list)
 *   GET   /agency/work-orders                 → work-order dicts[]      (list)
 *   GET   /agency/work-orders/{id}            → work-order dict         (full)
 *   PATCH /agency/work-orders/{id}/status     → work-order dict         (full, multipart)
 *
 * Decimal fields (`estimated_cost`, `proposal_amount`) arrive as strings and
 * are parsed to numbers here.
 */

import { api } from "@/lib/api/api-client"
import type {
  AgencyProposal,
  ProposalStatus,
  WorkOrderDetail,
  WorkOrderListItem,
  WorkOrderStatus,
} from "@/types/agency"
import type {
  AgencyTenderDetail,
  AgencyTenderListItem,
  TenderStatus,
} from "@/types/tender"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

interface RawTenderListItem {
  id: number
  complaint_id: string
  title: string
  estimated_cost: string
  closing_date: string
  status: string
}

interface RawTenderDetail extends RawTenderListItem {
  description: string
  created_at: string
}

interface RawProposal {
  proposal_id: number
  tender_id: number
  agency_id?: string
  proposal_amount: string
  proposal_document: string
  remarks: string | null
  status: string
  created_at?: string
}

interface RawWorkOrderListItem {
  id: number
  tender_id: number
  scope_of_work: string
  status: string
  remarks: string | null
  created_at: string
}

interface RawWorkOrderDetail extends RawWorkOrderListItem {
  start_date: string | null
  end_date: string | null
  completion_proof_url: string | null
  updated_at: string
}

function toTenderListItem(raw: RawTenderListItem): AgencyTenderListItem {
  return {
    id: raw.id,
    complaintId: raw.complaint_id,
    title: raw.title,
    estimatedCost: Number(raw.estimated_cost ?? 0),
    closingDate: raw.closing_date,
    status: raw.status as TenderStatus,
  }
}

function toProposal(raw: RawProposal): AgencyProposal {
  return {
    proposalId: raw.proposal_id,
    tenderId: raw.tender_id,
    agencyId: raw.agency_id,
    proposalAmount: Number(raw.proposal_amount ?? 0),
    proposalDocument: raw.proposal_document,
    remarks: raw.remarks ?? null,
    status: raw.status as ProposalStatus,
    createdAt: raw.created_at,
  }
}

function toWorkOrderListItem(raw: RawWorkOrderListItem): WorkOrderListItem {
  return {
    id: raw.id,
    tenderId: raw.tender_id,
    scopeOfWork: raw.scope_of_work,
    status: raw.status as WorkOrderStatus,
    remarks: raw.remarks ?? null,
    createdAt: raw.created_at,
  }
}

function toWorkOrderDetail(raw: RawWorkOrderDetail): WorkOrderDetail {
  return {
    ...toWorkOrderListItem(raw),
    startDate: raw.start_date ?? null,
    endDate: raw.end_date ?? null,
    completionProofUrl: raw.completion_proof_url ?? null,
    updatedAt: raw.updated_at,
  }
}

export const agencyService = {
  /** Open tenders the agency can bid on. */
  async listOpenTenders(): Promise<AgencyTenderListItem[]> {
    const res = await api.get<Envelope<RawTenderListItem[]>>("/agency/tenders")
    return (res.data ?? []).map(toTenderListItem)
  },

  /** Full detail for a single tender. */
  async getTender(tenderId: number): Promise<AgencyTenderDetail> {
    const res = await api.get<Envelope<RawTenderDetail>>(
      `/agency/tenders/${tenderId}`,
    )
    const raw = res.data
    return {
      ...toTenderListItem(raw),
      description: raw.description ?? "",
      createdAt: raw.created_at,
    }
  },

  /**
   * Submit a proposal (bid) for a tender. Multipart: the amount + optional
   * remarks as form fields plus a required `proposal_document` file.
   */
  async submitProposal(
    tenderId: number,
    input: { proposalAmount: number; remarks?: string; document: File },
  ): Promise<AgencyProposal> {
    const form = new FormData()
    form.append("proposal_amount", String(input.proposalAmount))
    if (input.remarks) form.append("remarks", input.remarks)
    form.append("proposal_document", input.document)

    const res = await api.postFormData<Envelope<RawProposal>>(
      `/agency/tenders/${tenderId}/proposal`,
      form,
    )
    return toProposal(res.data)
  },

  /** Proposals the logged-in agency has submitted. */
  async listProposals(): Promise<AgencyProposal[]> {
    const res = await api.get<Envelope<RawProposal[]>>("/agency/proposals")
    return (res.data ?? []).map(toProposal)
  },

  /** Work orders assigned to the logged-in agency. */
  async listWorkOrders(): Promise<WorkOrderListItem[]> {
    const res =
      await api.get<Envelope<RawWorkOrderListItem[]>>("/agency/work-orders")
    return (res.data ?? []).map(toWorkOrderListItem)
  },

  /** Full detail for a single work order. */
  async getWorkOrder(workOrderId: number): Promise<WorkOrderDetail> {
    const res = await api.get<Envelope<RawWorkOrderDetail>>(
      `/agency/work-orders/${workOrderId}`,
    )
    return toWorkOrderDetail(res.data)
  },

  /**
   * Update a work order's status. Multipart: the new `status` plus an optional
   * `completion_proof` file (required by the backend when marking Completed).
   * Returns the updated schedule/proof fields (a partial work order).
   */
  async updateWorkOrderStatus(
    workOrderId: number,
    input: { status: WorkOrderStatus; completionProof?: File },
  ): Promise<{
    id: number
    status: WorkOrderStatus
    startDate: string | null
    endDate: string | null
    completionProofUrl: string | null
    updatedAt: string | null
  }> {
    const form = new FormData()
    form.append("status", input.status)
    if (input.completionProof) {
      form.append("completion_proof", input.completionProof)
    }

    const res = await api.patchFormData<
      Envelope<{
        id: number
        status: string
        start_date: string | null
        end_date: string | null
        completion_proof_url: string | null
        updated_at: string | null
      }>
    >(`/agency/work-orders/${workOrderId}/status`, form)

    const raw = res.data
    return {
      id: raw.id,
      status: raw.status as WorkOrderStatus,
      startDate: raw.start_date ?? null,
      endDate: raw.end_date ?? null,
      completionProofUrl: raw.completion_proof_url ?? null,
      updatedAt: raw.updated_at ?? null,
    }
  },
}
