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
  type RawComplaint,
} from "@/lib/utils/complaint/normalize"
import type {
  Complaint,
  ComplaintRemark,
  CreateComplaintRequest,
  UpdateComplaintRequest,
} from "@/types/complaint"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

/** A complaint plus its images and activity timeline (detail view). */
export interface ComplaintWithImages {
  complaint: Complaint
  images: string[]
  remarks: ComplaintRemark[]
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
}
