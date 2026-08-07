/**
 * lib/utils/complaint/normalize.ts
 *
 * Maps the backend complaint response (snake_case, enum values as strings) to
 * the frontend `Complaint` shape. The backend now exposes citizen_id,
 * department_id, assigned_officer_id, ai_category/score, and district/country,
 * so this is a near 1:1 field rename. Type-only imports → no runtime deps.
 */

import type {
  Complaint,
  ComplaintPriority,
  ComplaintRemark,
  ComplaintStatus,
} from "@/types/complaint"
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
  author_id: string
  author_name?: string | null
  author_role?: string | null
  message: string
  status_from?: string | null
  status_to?: string | null
  created_at?: string | null
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
  images?: RawComplaintImage[] | null
  remarks?: RawComplaintRemark[] | null
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
    authorId: raw.author_id,
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
