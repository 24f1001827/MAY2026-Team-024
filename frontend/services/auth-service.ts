/**
 * services/auth-service.ts
 *
 * Client-side auth service. Uses the shared `api` client (`lib/api/api-client`)
 * to call this app's own auth route handlers under `/api/auth/*`, which proxy
 * Flask and manage the httpOnly session cookies. The client throws a typed
 * `ApiError` on failure; here we only refine the message (e.g. surface the
 * first field error from a 422) before it reaches the TanStack Query hooks.
 */

import { api, ApiError } from "@/lib/api/api-client"
import type { LoginCredentials, RegisterInput, SessionUser } from "@/types/auth"

/** Pull the first human-readable message out of the backend's 422 errors map. */
function firstValidationError(errors?: Record<string, string[]>): string | null {
  if (!errors) return null
  for (const messages of Object.values(errors)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") return messages[0]
  }
  return null
}

export const authService = {
  /** Sign in with email + password; resolves to the session user. */
  async login(credentials: LoginCredentials): Promise<SessionUser> {
    const { user } = await api.post<{ user: SessionUser }>("/auth/login", credentials)
    if (!user) throw new Error("Unable to sign in. Please try again.")
    return user
  },

  /** Register a new account. Resolves on success; throws a readable message otherwise. */
  async register({ role, payload }: RegisterInput): Promise<void> {
    try {
      await api.post(`/auth/register/${role}`, payload)
    } catch (error) {
      // Prefer the specific field-level message from a 422 over the generic one.
      if (error instanceof ApiError) {
        const fieldError = firstValidationError(error.errors)
        if (fieldError) throw new Error(fieldError)
      }
      throw error
    }
  },

  /** Clear the session. Best-effort — always resolves. */
  async logout(): Promise<void> {
    await api.post("/auth/logout").catch(() => {})
  },
}
