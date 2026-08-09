/**
 * lib/api/public-complaints.ts
 *
 * Server-only fetching for the PUBLIC (unauthenticated) complaint surfaces —
 * the city map at `/complaints` and its detail pages. Calls the Flask public
 * endpoints directly (no Bearer, no session), so it must never be imported from
 * client code. The backend anonymizes these responses (no citizen/officer id).
 *
 * Not guarded by the `server-only` package (not a dependency here); keep the
 * discipline manually — only server components / route handlers may import this.
 */

import { apiUrl } from "@/lib/api/config"
import {
  normalizeComplaint,
  normalizeComplaintImages,
  normalizeComplaintRemarks,
  type RawComplaint,
} from "@/lib/utils/complaint/normalize"
import type { Complaint, ComplaintRemark } from "@/types/complaint"
import type { ComplaintMapItem } from "@/features/dashboard/components/types"

interface Envelope<T> {
  data?: T
}

/** Public complaint rows carry the department name inline (no citizen id). */
type RawPublicComplaint = RawComplaint

/** Anonymize defensively: the backend already strips the id, but never trust it. */
function toMapItem(raw: RawPublicComplaint): ComplaintMapItem {
  const complaint: Complaint = { ...normalizeComplaint(raw), citizenId: "" }
  return { ...complaint, departmentName: raw.department ?? "Unassigned" }
}

/**
 * Second line of defence on the public timeline. The backend rebuilds these
 * entries through `PublicComplaintActivitySchema` (status transitions only, no
 * attribution), but this surface is unauthenticated, so drop any attribution
 * that reaches us anyway rather than rendering a staff name to the public.
 */
function toPublicRemark(remark: ComplaintRemark): ComplaintRemark {
  return { ...remark, authorId: null, authorName: "System", authorRole: null }
}

/**
 * All complaints for the public map, anonymized and enriched with department
 * name. Returns `[]` on any failure so the map still renders.
 */
export async function fetchPublicComplaints(): Promise<ComplaintMapItem[]> {
  try {
    const res = await fetch(apiUrl("/complaints/public"), { cache: "no-store" })
    if (!res.ok) return []
    const body = (await res.json()) as Envelope<RawPublicComplaint[]>
    return (body.data ?? []).map(toMapItem)
  } catch {
    return []
  }
}

/** A single anonymized complaint plus its activity, or `null` if not found. */
export async function fetchPublicComplaint(id: string): Promise<{
  complaint: Complaint
  departmentName: string
  remarks: ComplaintRemark[]
  images: string[]
} | null> {
  try {
    const res = await fetch(apiUrl(`/complaints/public/${id}`), {
      cache: "no-store",
    })
    if (!res.ok) return null
    const body = (await res.json()) as Envelope<RawPublicComplaint>
    const raw = body.data
    if (!raw) return null
    return {
      complaint: { ...normalizeComplaint(raw), citizenId: "" },
      departmentName: raw.department ?? "Unassigned",
      remarks: normalizeComplaintRemarks(raw).map(toPublicRemark),
      images: normalizeComplaintImages(raw),
    }
  } catch {
    return null
  }
}
