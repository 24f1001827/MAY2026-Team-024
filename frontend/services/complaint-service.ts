/**
 * services/complaint-service.ts
 *
 * Complaint service. Uses the shared `api` client to call this app's route
 * handlers, which forward the caller's Bearer token to Flask. Create/update are
 * multipart (optional images); the field names match the backend's
 * `ComplaintSchema` (`department_id`, snake_case) + `images` files.
 *
 * Endpoints:
 *   GET    /api/complaints/my           → Complaint[]  (citizen's own)
 *   GET    /api/admin/complaints        → Complaint[]  (admin, all)
 *   GET    /api/complaints/{id}         → { complaint, images } (detail)
 *   POST   /api/complaints (multipart)  → Complaint    (full created record)
 *   PUT    /api/complaints/{id} (multipart) → Complaint
 *   DELETE /api/complaints/{id}         → void
 */

import { api } from "@/lib/api/api-client"
import {
  normalizeComplaint,
  normalizeComplaintImages,
  normalizeComplaintRemarks,
  normalizeComplaintReviewReport,
  normalizeComplaintTender,
  type RawComplaint,
} from "@/lib/utils/complaint/normalize"
import type {
  Complaint,
  ComplaintRemark,
  CreateComplaintRequest,
  UpdateComplaintRequest,
} from "@/types/complaint"
import type { ComplaintTenderSummary } from "@/types/tender"
import type { ReviewDecision, ReviewReport } from "@/types/officer"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

/** A complaint plus its images and activity timeline (detail view). */
export interface ComplaintWithImages {
  complaint: Complaint
  images: string[]
  remarks: ComplaintRemark[]
  /** The complaint's tender, or null if none has been published yet. */
  tender: ComplaintTenderSummary | null
  /** The officer's review report, or null if not submitted yet. */
  reviewReport: ReviewReport | null
}

/** Build the multipart body the backend expects from a create/update input. */
function toFormData(
  input: CreateComplaintRequest | UpdateComplaintRequest,
  images: File[],
): FormData {
  const fd = new FormData()
  fd.append("title", input.title)
  fd.append("description", input.description)
  fd.append("department_id", String(input.departmentId))
  fd.append("latitude", String(input.latitude))
  fd.append("longitude", String(input.longitude))
  fd.append("address", input.address)
  fd.append("locality", input.locality)
  fd.append("city", input.city)
  fd.append("district", input.district)
  fd.append("state", input.state)
  fd.append("country", input.country)
  fd.append("pincode", input.pincode)
  for (const file of images) fd.append("images", file)
  return fd
}

export const complaintService = {
  /** The signed-in citizen's own complaints. */
  async listMine(): Promise<Complaint[]> {
    const res = await api.get<Envelope<RawComplaint[]>>("/complaints/my")
    return (res.data ?? []).map(normalizeComplaint)
  },

  /** Admin: all complaints. */
  async listAll(): Promise<Complaint[]> {
    const res = await api.get<Envelope<RawComplaint[]>>("/admin/complaints")
    return (res.data ?? []).map(normalizeComplaint)
  },

  /** A single complaint with its images (detail view). */
  async getById(id: string): Promise<ComplaintWithImages> {
    const res = await api.get<Envelope<RawComplaint>>(`/complaints/${id}`)
    return {
      complaint: normalizeComplaint(res.data),
      images: normalizeComplaintImages(res.data),
      remarks: normalizeComplaintRemarks(res.data),
      tender: normalizeComplaintTender(res.data),
      reviewReport: normalizeComplaintReviewReport(res.data),
    }
  },

  /** Citizen: file a new complaint (with optional images). */
  async create(
    input: CreateComplaintRequest,
    images: File[] = [],
  ): Promise<Complaint> {
    const res = await api.postFormData<Envelope<RawComplaint>>(
      "/complaints",
      toFormData(input, images),
    )
    return normalizeComplaint(res.data)
  },

  /** Citizen: update an existing complaint (optionally replacing images). */
  async update(
    id: string,
    input: UpdateComplaintRequest,
    images: File[] = [],
  ): Promise<Complaint> {
    const res = await api.putFormData<Envelope<RawComplaint>>(
      `/complaints/${id}`,
      toFormData(input, images),
    )
    return normalizeComplaint(res.data)
  },

  /** Citizen: delete a complaint. */
  async remove(id: string): Promise<void> {
    await api.delete(`/complaints/${id}`)
  },

  /** Citizen owner: reopen a resolved/closed complaint with a reason. */
  async reopen(id: string, reason: string): Promise<void> {
    await api.patch(`/complaints/${id}/reopen`, { reason })
  },

  /** Citizen owner: close a resolved complaint. */
  async close(id: string): Promise<void> {
    await api.patch(`/complaints/${id}/close`, {})
  },

  /** Admin: allocate budget to a complaint awaiting it. */
  async allocateBudget(id: string, amount: number): Promise<void> {
    await api.patch(`/admin/complaints/${id}/allocate-budget`, { amount })
  },

  /** Admin: the officer's review report for a complaint (null if none). */
  async getReviewReport(id: string): Promise<ReviewReport | null> {
    const res = await api.get<
      Envelope<{
        complaint_id: string
        findings: string
        estimated_cost?: string | number | null
        estimated_duration_days?: number | null
        decision: string
        review_date: string
      } | null>
    >(`/admin/complaints/${id}/review-report`)
    const raw = res.data
    if (!raw) return null
    return {
      complaintId: raw.complaint_id,
      findings: raw.findings,
      estimatedCost:
        raw.estimated_cost != null ? Number(raw.estimated_cost) : null,
      estimatedDurationDays: raw.estimated_duration_days ?? null,
      decision: raw.decision as ReviewDecision,
      reviewDate: raw.review_date,
    }
  },

  /** Officer/admin: add a remark to a complaint's activity timeline. */
  async addRemark(id: string, message: string): Promise<void> {
    await api.post(`/complaints/${id}/remark`, { message })
  },
}
