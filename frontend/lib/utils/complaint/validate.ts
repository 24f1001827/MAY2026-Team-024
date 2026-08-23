/**
 * lib/utils/complaint/validate.ts
 *
 * Client-side validation for the complaint form, mirroring the backend
 * `ComplaintSchema` + `validate_images` rules so users get immediate, specific
 * feedback instead of a round-trip 422. Returns the first human-readable error
 * message, or null when the input is valid. Type-only imports → unit-testable.
 */

import { distanceKm } from "@/lib/utils/geo"
import type { AddressCentroid } from "@/lib/utils/complaint/location-data"
import type {
  CreateComplaintRequest,
  UpdateComplaintRequest,
} from "@/types/complaint"

/** Image constraints — must match backend `validate_images`. */
export const IMAGE_RULES = {
  maxCount: 5,
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  allowedTypes: ["image/jpeg", "image/png"] as const,
  allowedExtensions: ["jpg", "jpeg", "png"] as const,
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".")
  return i === -1 ? "" : name.slice(i + 1).toLowerCase()
}

/** Validate the assembled complaint input. Returns the first error, or null. */
export function validateComplaintInput(
  input: CreateComplaintRequest | UpdateComplaintRequest,
): string | null {
  const title = input.title.trim()
  if (title.length < 5) return "Title must be at least 5 characters."
  if (title.length > 255) return "Title cannot exceed 255 characters."

  if (input.description.trim().length < 10)
    return "Description must be at least 10 characters."

  if (!Number.isFinite(input.departmentId) || input.departmentId <= 0)
    return "Choose which department should handle this complaint."

  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude))
    return "Drop a pin on the map to set the complaint's location."
  if (input.latitude < -90 || input.latitude > 90)
    return "The selected latitude is out of range."
  if (input.longitude < -180 || input.longitude > 180)
    return "The selected longitude is out of range."

  if (input.address.trim().length < 5)
    return "Address must be at least 5 characters."
  if (input.locality.trim().length < 2) return "Locality is required."
  if (input.city.trim().length < 2) return "City is required."
  if (input.district.trim().length < 2) return "District is required."
  if (input.state.trim().length < 2) return "State is required."
  if (input.country.trim().length < 2) return "Country is required."
  if (!/^\d{6}$/.test(input.pincode.trim()))
    return "Enter a valid 6-digit PIN code."

  return null
}

/**
 * Slack allowed on top of an address's own spread, in km. A PIN represented by
 * a single row in the postal dataset has a radius of 0, so without a floor any
 * pin dropped a street away would read as a mismatch.
 */
const LOCATION_TOLERANCE_KM = 25

/** How the map pin relates to the chosen address. */
export interface LocationMatch {
  distanceKm: number
  toleranceKm: number
  /** True when the pin sits further out than the address can account for. */
  mismatch: boolean
}

/**
 * Compare the dropped pin against the centroid of the selected address.
 *
 * The tolerance scales with how specific the address is — a whole state is
 * allowed hundreds of km of slack, a single PIN only the floor above — so
 * choosing just a state doesn't produce false alarms. Returns null when there
 * isn't enough information to compare (no pin, or an address we can't place).
 */
export function checkLocationMatch(
  coords: { lat: number | null; lng: number | null } | null,
  centroid: AddressCentroid | null,
): LocationMatch | null {
  if (!centroid || !coords) return null
  const { lat, lng } = coords
  if (lat == null || lng == null) return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const distance = distanceKm({ lat, lng }, centroid)
  const tolerance = centroid.radiusKm + LOCATION_TOLERANCE_KM

  return {
    distanceKm: distance,
    toleranceKm: tolerance,
    mismatch: distance > tolerance,
  }
}

/**
 * Validate selected images. `require` is true on create (backend needs ≥1),
 * false on edit (photos optional; only validated when provided).
 */
export function validateComplaintImages(
  images: File[],
  require: boolean,
): string | null {
  if (images.length === 0) {
    return require ? "Attach at least one photo of the issue." : null
  }
  if (images.length > IMAGE_RULES.maxCount)
    return `You can upload at most ${IMAGE_RULES.maxCount} photos.`

  for (const file of images) {
    const okType =
      (IMAGE_RULES.allowedTypes as readonly string[]).includes(file.type) ||
      (IMAGE_RULES.allowedExtensions as readonly string[]).includes(
        extensionOf(file.name),
      )
    if (!okType) return "Only JPG, JPEG and PNG images are allowed."
    if (file.size > IMAGE_RULES.maxSizeBytes)
      return `"${file.name}" exceeds the maximum size of 10 MB.`
  }

  return null
}
