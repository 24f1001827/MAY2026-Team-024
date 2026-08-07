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

/**
 * Build a fully-qualified backend URL from a prefixed path (e.g. "/auth/login").
 *
 * Normalizes the join so a stray slash in the env or the path can't produce a
 * doubled `//` or a missing separator: the base loses trailing slashes, the
 * prefix and path are reduced to exactly one leading slash each. A base subpath
 * (e.g. behind a gateway, "http://host/gw") is preserved — hence string joins
 * rather than `new URL(prefix, base)`, which would drop it. The `https?://`
 * double slash is untouched because only the base's *trailing* slashes are
 * stripped.
 */
export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, "")
  const prefix = "/" + API_PREFIX.replace(/^\/+|\/+$/g, "")
  const suffix = path ? "/" + path.replace(/^\/+/, "") : ""
  return `${base}${prefix}${suffix}`
}
