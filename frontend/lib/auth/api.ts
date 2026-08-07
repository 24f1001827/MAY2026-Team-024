/**
 * lib/auth/api.ts
 *
 * Server-only thin wrappers around the Flask auth endpoints. Called from the
 * Next route handlers under `app/api/auth/*` — never from client components.
 * Each helper returns the parsed JSON body plus the HTTP status so the route
 * handler can pass the backend's own message/status straight through.
 */

import { apiUrl } from "@/lib/api/config"

/** Shape the backend returns for a successful login (`data` field). */
export interface BackendSession {
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
    is_department_head?: boolean
  }
  access_token: string
  refresh_token: string
}

/** Generic `{ status, body }` result from a backend auth call. */
export interface BackendResult<T = unknown> {
  status: number
  // The backend always responds with `{ success, message, ... }`.
  body: { success?: boolean; message?: string; data?: T; errors?: unknown } & Record<
    string,
    unknown
  >
}

/** Registration roles the backend accepts, matching its route segments. */
export type RegisterRole = "citizen" | "agency" | "officer"

async function postJson<T>(path: string, payload: unknown): Promise<BackendResult<T>> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // Backend auth is stateless (JWT in the body); no cookies to forward.
    cache: "no-store",
  })

  let body: BackendResult<T>["body"] = {}
  try {
    body = await res.json()
  } catch {
    // Non-JSON (e.g. a 500 HTML page) — leave body empty; caller uses status.
  }

  return { status: res.status, body }
}

/** POST /auth/login — returns the session payload on 200. */
export function backendLogin(email: string, password: string) {
  return postJson<BackendSession>("/auth/login", { email, password })
}

/** POST /auth/register/{role} — returns the created user on 201. */
export function backendRegister(role: RegisterRole, payload: Record<string, unknown>) {
  return postJson(`/auth/register/${role}`, payload)
}
