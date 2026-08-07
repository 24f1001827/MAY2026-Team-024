/**
 * Payload for creating a complaint (citizen-authored fields only). Priority is
 * NOT collected — the backend defaults it (AI classification sets it later).
 * Maps to the backend `ComplaintSchema` (sent as multipart, with `images`).
 */
export interface CreateComplaintRequest {
  title: string
  description: string
  departmentId: number
  latitude: number
  longitude: number
  address: string
  locality: string
  city: string
  district: string
  state: string
  pincode: string
  country: string
}
