/**
 * services/officer-service.ts
 *
 * Officer-scoped operations that hit the officer API through this app's route
 * handlers (Bearer forwarded server-side). Covers the department dashboard
 * (department + officers + complaints), complaint allotment (head-only), and
 * tender management (create a tender for a complaint, review its proposals,
 * shortlist/accept a bid, and award a work order).
 *
 * Tender endpoint audit (backend contract → classification):
 *   POST  /officer/complaints/{id}/tender     → TenderResponseSchema        (full)
 *   GET   /officer/tenders/{id}/proposals     → OfficerProposalListSchema[] (list)
 *   GET   /officer/proposals/{id}             → OfficerProposalDetailSchema (full)
 *   PATCH /officer/proposals/{id}/status      → OfficerProposalDetailSchema (full)
 *   POST  /officer/proposals/{id}/work-order  → work-order dict             (full)
 */

import { api } from "@/lib/api/api-client"
import {
  normalizeDepartmentDashboard,
  type RawDepartmentDashboard,
} from "@/lib/utils/department/dashboard-normalize"
import type {
  ProposalStatus,
  WorkOrderStatus,
} from "@/types/agency"
import type { DepartmentDashboardData } from "@/types/department"
import type {
  AvailabilityStatus,
  CreateReviewReportInput,
  OfficerDirectoryItem,
  OfficerProposal,
  ReviewDecision,
  ReviewReport,
} from "@/types/officer"
import type {
  CreatedTender,
  OfficerTenderListItem,
  TenderStatus,
} from "@/types/tender"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

/** Raw directory row from the backend. */
interface RawOfficerDirectory {
  user_id: string
  name: string
  department?: string | null
  availability_status: string
}

interface RawOfficerProposal {
  proposal_id: number
  tender_id?: number
  agency_id: string
  agency_name?: string | null
  contact_person?: string | null
  proposal_amount: string
  proposal_document: string
  remarks: string | null
  status: string
  created_at: string
  updated_at?: string
}

function toOfficerProposal(raw: RawOfficerProposal): OfficerProposal {
  return {
    proposalId: raw.proposal_id,
    tenderId: raw.tender_id,
    agencyId: raw.agency_id,
    agencyName: raw.agency_name ?? null,
    contactPerson: raw.contact_person ?? null,
    proposalAmount: Number(raw.proposal_amount ?? 0),
    proposalDocument: raw.proposal_document,
    remarks: raw.remarks ?? null,
    status: raw.status as ProposalStatus,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export const officerService = {
  /** Shared officer directory (name, department, availability) — any auth user. */
  async listDirectory(): Promise<OfficerDirectoryItem[]> {
    const res = await api.get<Envelope<RawOfficerDirectory[]>>("/officers")
    return (res.data ?? []).map((o) => ({
      userId: o.user_id,
      name: o.name,
      department: o.department ?? "Unassigned",
      availabilityStatus: o.availability_status as AvailabilityStatus,
    }))
  },

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

  /**
   * The assigned officer hands their pending assignment back, optionally
   * saying why. The complaint returns to the department queue (or is
   * auto-offered onward), so a reason is what the head re-allots on.
   */
  async rejectAssignment(complaintId: string, reason?: string): Promise<void> {
    await api.patch(`/officer/complaints/${complaintId}/reject`, {
      reason: reason?.trim() ? reason.trim() : null,
    })
  },

  /** The officer's own tenders (oversight list). */
  async listMyTenders(): Promise<OfficerTenderListItem[]> {
    const res = await api.get<
      Envelope<
        {
          id: number
          complaint_id: string
          complaint_title?: string | null
          title: string
          status: string
          estimated_cost?: string | number | null
          closing_date: string
          created_at: string
        }[]
      >
    >("/officer/tenders")
    return (res.data ?? []).map((t) => ({
      id: t.id,
      complaintId: t.complaint_id,
      complaintTitle: t.complaint_title ?? "—",
      title: t.title,
      status: t.status as TenderStatus,
      estimatedCost: Number(t.estimated_cost ?? 0),
      closingDate: t.closing_date,
      createdAt: t.created_at,
    }))
  },

  /** Submit the inspection review report for an assigned complaint. */
  async submitReviewReport(
    complaintId: string,
    input: CreateReviewReportInput,
  ): Promise<ReviewReport> {
    const res = await api.post<
      Envelope<{
        complaint_id: string
        findings: string
        estimated_cost?: string | number | null
        estimated_duration_days?: number | null
        decision: string
        review_date: string
      }>
    >(`/officer/complaints/${complaintId}/review-report`, {
      findings: input.findings,
      decision: input.decision,
      ...(input.estimatedCost != null
        ? { estimated_cost: input.estimatedCost }
        : {}),
      ...(input.estimatedDurationDays != null
        ? { estimated_duration_days: input.estimatedDurationDays }
        : {}),
    })
    const raw = res.data
    return {
      complaintId: raw.complaint_id,
      findings: raw.findings,
      estimatedCost: raw.estimated_cost != null ? Number(raw.estimated_cost) : null,
      estimatedDurationDays: raw.estimated_duration_days ?? null,
      decision: raw.decision as ReviewDecision,
      reviewDate: raw.review_date,
    }
  },

  /** Request budget allocation for a complaint (decision was TenderRequired). */
  async requestBudget(complaintId: string): Promise<void> {
    await api.post(`/officer/complaints/${complaintId}/budget-request`, {})
  },

  /** Create a tender for a complaint. `closingDate` is an ISO datetime string. */
  async createTender(
    complaintId: string,
    input: { title: string; description?: string; closingDate: string },
  ): Promise<CreatedTender> {
    const res = await api.post<
      Envelope<{
        id: number
        complaint_id: string
        title: string
        description: string
        estimated_cost: string | number
        closing_date: string
        status: string
      }>
    >(`/officer/complaints/${complaintId}/tender`, {
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      closing_date: input.closingDate,
    })
    const raw = res.data
    return {
      id: raw.id,
      complaintId: raw.complaint_id,
      title: raw.title,
      description: raw.description ?? "",
      estimatedCost: Number(raw.estimated_cost ?? 0),
      closingDate: raw.closing_date,
      status: raw.status as TenderStatus,
    }
  },

  /** Proposals submitted against one of the officer's tenders. */
  async listTenderProposals(tenderId: number): Promise<OfficerProposal[]> {
    const res = await api.get<Envelope<RawOfficerProposal[]>>(
      `/officer/tenders/${tenderId}/proposals`,
    )
    return (res.data ?? []).map(toOfficerProposal)
  },

  /** Full detail for a single proposal. */
  async getProposal(proposalId: number): Promise<OfficerProposal> {
    const res = await api.get<Envelope<RawOfficerProposal>>(
      `/officer/proposals/${proposalId}`,
    )
    return toOfficerProposal(res.data)
  },

  /** Shortlist / accept / reject a proposal. */
  async updateProposalStatus(
    proposalId: number,
    status: ProposalStatus,
  ): Promise<OfficerProposal> {
    const res = await api.patch<Envelope<RawOfficerProposal>>(
      `/officer/proposals/${proposalId}/status`,
      { status },
    )
    return toOfficerProposal(res.data)
  },

  /** Verify a completed work order (moves the complaint to Resolved). */
  async verifyWorkOrder(workOrderId: number): Promise<void> {
    await api.patch(`/officer/work-orders/${workOrderId}/verify`, {})
  },

  /** Send a work order back as incomplete, with remarks. */
  async markWorkOrderIncomplete(
    workOrderId: number,
    remarks: string,
  ): Promise<void> {
    await api.patch(`/officer/work-orders/${workOrderId}/mark-incomplete`, {
      remarks,
    })
  },

  /** Award a work order to the agency behind an accepted proposal. */
  async createWorkOrder(
    proposalId: number,
    input: { scopeOfWork: string; remarks?: string },
  ): Promise<{ id: number; tenderId: number; agencyId: string; status: WorkOrderStatus }> {
    const res = await api.post<
      Envelope<{
        id: number
        tender_id: number
        agency_id: string
        status: string
      }>
    >(`/officer/proposals/${proposalId}/work-order`, {
      scope_of_work: input.scopeOfWork,
      ...(input.remarks ? { remarks: input.remarks } : {}),
    })
    const raw = res.data
    return {
      id: raw.id,
      tenderId: raw.tender_id,
      agencyId: raw.agency_id,
      status: raw.status as WorkOrderStatus,
    }
  },
}
