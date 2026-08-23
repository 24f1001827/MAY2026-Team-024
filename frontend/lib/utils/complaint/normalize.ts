/**
 * lib/utils/complaint/normalize.ts
 *
 * Maps the backend complaint response (snake_case, enum values as strings) to
 * the frontend `Complaint` shape. The backend now exposes citizen_id,
 * department_id, assigned_officer_id, ai_category/score, and district/country,
 * so this is a near 1:1 field rename. Type-only imports → no runtime deps.
 */

import type {
  DisputeOutcome,
  Complaint,
  ComplaintPriority,
  ComplaintRemark,
  ComplaintStatus,
} from "@/types/complaint"
import type { WorkOrderStatus } from "@/types/agency"
import type { ReviewDecision, ReviewReport } from "@/types/officer"
import type { ComplaintTenderSummary, TenderStatus } from "@/types/tender"
import { normalizeRole } from "@/lib/utils/user/normalize"

/** A complaint image as the backend serializes it. */
export interface RawComplaintImage {
  id?: number
  image_url: string
}

/** A complaint remark as the backend serializes it (detail endpoint only). */
export interface RawComplaintRemark {
  id: number
  complaint_id: string
  author_id: string | null
  author_name?: string | null
  author_role?: string | null
  message: string
  status_from?: string | null
  status_to?: string | null
  created_at?: string | null
}

/** A work-order summary embedded under a complaint's tender (detail only). */
export interface RawComplaintWorkOrder {
  id: number
  status: string
  scope_of_work?: string | null
  completion_proof_url?: string | null
}

/** A tender summary embedded in a complaint detail (detail endpoint only). */
export interface RawComplaintTender {
  id: number
  title: string
  status: string
  estimated_cost?: string | number | null
  closing_date?: string | null
  work_order?: RawComplaintWorkOrder | null
}

/** A complaint row exactly as the backend serializes it. */
export interface RawComplaint {
  id: string
  title: string
  description: string
  citizen_id: string
  department_id: number
  department?: string | null
  assigned_officer_id?: string | null
  status: string
  priority: string
  ai_category?: string | null
  ai_priority_score?: number | null
  cluster_id?: string | null
  is_cluster_primary?: boolean
  cluster_disputed?: boolean
  cluster_report_count?: number
  cluster_primary_id?: string | null
  cluster_primary_title?: string | null
  dispute_reason?: string | null
  dispute_raised_at?: string | null
  dispute_outcome?: string | null
  dispute_resolution_note?: string | null
  dispute_resolved_at?: string | null
  dispute_resolved_by_name?: string | null
  rejection_history?: {
    officer_id?: string
    officer_name?: string | null
    reason?: string | null
    rejected_at?: string | null
  }[]
  latitude?: number | string | null
  longitude?: number | string | null
  address: string
  locality: string
  city: string
  district?: string | null
  state: string
  country?: string | null
  pincode: string
  created_at?: string | null
  updated_at?: string | null
  allocated_budget?: string | number | null
  budget_year?: string | null
  images?: RawComplaintImage[] | null
  remarks?: RawComplaintRemark[] | null
  tender?: RawComplaintTender | null
  review_report?: RawComplaintReviewReport | null
}

/** The officer's review report embedded in a complaint detail. */
export interface RawComplaintReviewReport {
  findings: string
  estimated_cost?: string | number | null
  estimated_duration_days?: number | null
  decision: string
  review_date?: string | null
}

function toNumberOrNull(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function normalizeComplaint(raw: RawComplaint): Complaint {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    citizenId: raw.citizen_id,
    departmentId: raw.department_id,
    assignedOfficerId: raw.assigned_officer_id ?? null,
    // Enum values already align with the frontend unions (the backend renamed
    // "TenderAlloted" → "TenderAllotted"); cast straight through.
    priority: raw.priority as ComplaintPriority,
    status: raw.status as ComplaintStatus,
    latitude: toNumberOrNull(raw.latitude),
    longitude: toNumberOrNull(raw.longitude),
    address: raw.address,
    locality: raw.locality,
    city: raw.city,
    district: raw.district ?? "",
    state: raw.state,
    country: raw.country ?? "",
    pincode: raw.pincode,
    aiCategory: raw.ai_category ?? null,
    aiPriorityScore: raw.ai_priority_score ?? null,
    clusterId: raw.cluster_id ?? null,
    isClusterPrimary: raw.is_cluster_primary ?? false,
    clusterDisputed: raw.cluster_disputed ?? false,
    clusterReportCount: raw.cluster_report_count ?? 0,
    clusterPrimaryId: raw.cluster_primary_id ?? null,
    clusterPrimaryTitle: raw.cluster_primary_title ?? null,
    disputeReason: raw.dispute_reason ?? null,
    disputeRaisedAt: raw.dispute_raised_at ?? null,
    disputeOutcome: (raw.dispute_outcome as DisputeOutcome | null) ?? null,
    disputeResolutionNote: raw.dispute_resolution_note ?? null,
    disputeResolvedAt: raw.dispute_resolved_at ?? null,
    disputeResolvedByName: raw.dispute_resolved_by_name ?? null,
    rejectionHistory: (raw.rejection_history ?? []).map((entry) => ({
      officerId: entry.officer_id ?? "",
      officerName: entry.officer_name ?? null,
      reason: entry.reason ?? null,
      rejectedAt: entry.rejected_at ?? null,
    })),
    allocatedBudget: toNumberOrNull(raw.allocated_budget),
    budgetYear: raw.budget_year ?? null,
    createdAt: raw.created_at ?? "",
    updatedAt: raw.updated_at ?? "",
  }
}

/** Image URLs for a complaint (frontend uses a plain string[] for the gallery). */
export function normalizeComplaintImages(raw: RawComplaint): string[] {
  return (raw.images ?? []).map((img) => img.image_url)
}

/** Map a backend remark to the frontend timeline shape. */
export function normalizeComplaintRemark(
  raw: RawComplaintRemark,
): ComplaintRemark {
  return {
    id: String(raw.id),
    complaintId: raw.complaint_id,
    authorId: raw.author_id ?? null,
    authorName: raw.author_name ?? "Unknown",
    authorRole: raw.author_role ? normalizeRole(raw.author_role) : null,
    message: raw.message,
    statusFrom: (raw.status_from as ComplaintStatus | null) ?? null,
    statusTo: (raw.status_to as ComplaintStatus | null) ?? null,
    createdAt: raw.created_at ?? "",
  }
}

/** All remarks for a complaint (detail endpoint), normalized. */
export function normalizeComplaintRemarks(
  raw: RawComplaint,
): ComplaintRemark[] {
  return (raw.remarks ?? []).map(normalizeComplaintRemark)
}

/** The complaint's review report (detail endpoint), or null if not submitted. */
export function normalizeComplaintReviewReport(
  raw: RawComplaint,
): ReviewReport | null {
  const r = raw.review_report
  if (!r) return null
  return {
    complaintId: raw.id,
    findings: r.findings,
    estimatedCost: r.estimated_cost != null ? Number(r.estimated_cost) : null,
    estimatedDurationDays: r.estimated_duration_days ?? null,
    decision: r.decision as ReviewDecision,
    reviewDate: r.review_date ?? "",
  }
}

/** The complaint's tender summary (detail endpoint), or null if none yet. */
export function normalizeComplaintTender(
  raw: RawComplaint,
): ComplaintTenderSummary | null {
  const t = raw.tender
  if (!t) return null
  const wo = t.work_order
  return {
    id: t.id,
    title: t.title,
    status: t.status as TenderStatus,
    estimatedCost: Number(t.estimated_cost ?? 0),
    closingDate: t.closing_date ?? "",
    workOrder: wo
      ? {
          id: wo.id,
          status: wo.status as WorkOrderStatus,
          scopeOfWork: wo.scope_of_work ?? "",
          completionProofUrl: wo.completion_proof_url ?? null,
        }
      : null,
  }
}
