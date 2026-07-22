import type { CreateOfficerRequest } from "./create-officer"
import type { Officer } from "./officer"

/**
 * Payload for the officer edit form — the same editable fields as create, plus
 * the userId of the officer being updated. Ready to PATCH once the backend lands.
 */
export interface UpdateOfficerRequest extends CreateOfficerRequest {
  userId: Officer["userId"]
}
