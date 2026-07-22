import type { CreateAgencyRequest } from "./create-agency"
import type { Agency } from "./agency"

/**
 * Payload for the agency edit form — the same editable fields as create, plus
 * the id of the agency being updated. Ready to PATCH once the backend lands.
 */
export interface UpdateAgencyRequest extends CreateAgencyRequest {
  id: Agency["id"]
}
