/**
 * lib/api/backend.ts
 *
 * Server-only helper for calling AUTHENTICATED Flask endpoints from route
 * handlers. It reads the access token from the httpOnly session cookie
 * (`getAccessToken`) and forwards it as `Authorization: Bearer …`. This is the
 * authed analogue of `lib/auth/api.ts` (which hits the unauthenticated auth
 * endpoints). Never import from client code — it touches next/headers.
 */

import { apiUrl } from "@/lib/api/config"
import { getAccessToken } from "@/lib/auth/current-user"

interface BackendRequest {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /** JSON body; omitted for GET/DELETE. */
  json?: unknown
  /**
   * Multipart body to forward as-is (e.g. a complaint create/update with
   * images). When set, no Content-Type is added — fetch derives the multipart
   * boundary itself. Mutually exclusive with `json`.
   */
  formData?: FormData
  /** Query params appended to the path. */
  params?: Record<string, string | undefined>
}

export interface BackendResult<T = unknown> {
  status: number
  body: { success?: boolean; message?: string; data?: T; errors?: unknown } & Record<
    string,
    unknown
  >
}

/**
 * Call a prefixed backend path (e.g. "/admin/users") with the current user's
 * Bearer token. Returns `{ status, body }` so the route handler can pass the
 * backend's status + message straight through. If there's no session token,
 * short-circuits with a synthetic 401 (never calls Flask unauthenticated).
 */
export async function backendFetch<T = unknown>(
  path: string,
  { method = "GET", json, formData, params }: BackendRequest = {},
): Promise<BackendResult<T>> {
  const token = await getAccessToken()
  if (!token) {
    return { status: 401, body: { success: false, message: "Not authenticated." } }
  }

  const url = new URL(apiUrl(path))
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, value)
    }
  }

  // Multipart forwards as-is (no Content-Type — fetch sets the boundary). JSON
  // bodies are stringified with an explicit Content-Type.
  const requestBody =
    formData !== undefined
      ? formData
      : json !== undefined
        ? JSON.stringify(json)
        : undefined

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: requestBody,
    cache: "no-store",
  })

  let body: BackendResult<T>["body"] = {}
  try {
    body = await res.json()
  } catch {
    // Non-JSON error page — leave empty; caller uses status.
  }

  return { status: res.status, body }
}
