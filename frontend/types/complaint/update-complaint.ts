import type { CreateComplaintRequest } from "./create-complaint"

/**
 * Payload for updating a complaint. The backend PUT reuses the full
 * `ComplaintSchema` (a complete replacement, all fields required), so this is
 * the same shape as the create input — not a partial. Priority is not edited
 * here; the backend owns it. Images are optional on update (only replace the
 * existing set when provided).
 */
export type UpdateComplaintRequest = CreateComplaintRequest
