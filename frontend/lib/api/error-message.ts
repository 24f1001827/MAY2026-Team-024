/**
 * lib/api/error-message.ts
 *
 * Turn any thrown error into a human-readable message for toasts. For an
 * `ApiError` carrying field-level validation errors (the backend's 422
 * `{ errors: { field: [msg] } }`), it surfaces the actual field messages rather
 * than the generic top-level "Validation failed." — so users (and developers)
 * see which field was rejected.
 */

import { ApiError } from "@/lib/api/api-client"

/** Flatten an ApiError's field errors to "field: message" lines. */
function fieldErrorLines(errors: Record<string, string[]>): string[] {
  return Object.entries(errors).flatMap(([field, messages]) =>
    (messages ?? []).map((m) =>
      // "images" → the message already reads as a sentence; prefix other fields.
      field === "images" || field === "_schema" ? m : `${field}: ${m}`,
    ),
  )
}

/**
 * Best human-readable message for an unknown thrown value. Prefers ApiError
 * field errors, then the error message, then a fallback.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError) {
    if (error.errors && Object.keys(error.errors).length > 0) {
      const lines = fieldErrorLines(error.errors)
      if (lines.length > 0) return lines.join("\n")
    }
    return error.message || fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
