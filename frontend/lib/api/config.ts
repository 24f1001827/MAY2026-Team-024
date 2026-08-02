/**
 * lib/api/config.ts
 *
 * Server-only configuration for talking to the Flask backend. Auth (and, later,
 * data) requests are proxied through Next route handlers/server components so the
 * base URL and any tokens stay server-side. Do NOT import this from client code
 * (there is no `NEXT_PUBLIC_` prefix, so `API_BASE_URL` is undefined in browsers).
 */

/** Base URL of the Flask API, e.g. http://localhost:5000. Overridable via env. */
export const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5000"

/** Shared prefix for all backend routes. */
export const API_PREFIX = "/api/v1"

/** Build a fully-qualified backend URL from a prefixed path (e.g. "/auth/login"). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${API_PREFIX}${path}`
}
