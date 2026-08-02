/**
 * Registration payloads, keyed by the backend's role route segment. Fields are
 * snake_case to match the Flask schemas exactly (the service forwards them
 * as-is to `/api/auth/register/{role}`).
 */

export type RegisterRole = "citizen" | "officer" | "agency"

interface BaseRegisterPayload {
  name: string
  email: string
  phone: string
  password: string
}

export type CitizenRegisterPayload = BaseRegisterPayload

export interface OfficerRegisterPayload extends BaseRegisterPayload {
  department: string
}

export interface AgencyRegisterPayload extends BaseRegisterPayload {
  contact_person: string
  registration_number: string
  license_number: string
}

/** Discriminated union so each role carries exactly its required fields. */
export type RegisterInput =
  | { role: "citizen"; payload: CitizenRegisterPayload }
  | { role: "officer"; payload: OfficerRegisterPayload }
  | { role: "agency"; payload: AgencyRegisterPayload }
