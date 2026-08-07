/**
 * lib/auth/access-token.ts
 *
 * Server-only verification of the backend-issued access token (JWT). This is
 * the *authoritative* source of identity and role for server-side gating.
 *
 * Why this exists: the `rastro_user` cookie is an unsigned JSON snapshot. Even
 * though it is httpOnly (unreadable from page JS), the browser owner still
 * controls their own cookie jar and can forge a value like `role: "Admin"`.
 * Authorizing off that snapshot would allow privilege escalation. The access
 * token, by contrast, is an HS256 JWT signed by Flask with `JWT_SECRET_KEY`
 * (flask_jwt_extended default alg), so its `role` claim cannot be forged
 * without the secret. We verify the signature and read `sub`/`email`/`role`
 * from the verified payload; the JSON snapshot is display-only from here on.
 *
 * The backend embeds these claims in `generate_access_token`
 * (`additional_claims={ email, role }`, `identity=str(user.id)`), and its own
 * `role_required` middleware gates on the same `role` claim — so the frontend
 * and backend authorize off an identical, verifiable source.
 */

import { jwtVerify } from "jose"

import { normalizeRole } from "@/lib/utils/user/normalize"
import type { UserRole } from "@/types/user"

/** Identity fields proven by the signed access token. */
export interface VerifiedIdentity {
  /** JWT `sub` — the user id. */
  id: string
  email: string
  role: UserRole
}

let warnedMissingSecret = false

/**
 * Resolve the shared symmetric secret (must match the backend's
 * `JWT_SECRET_KEY`). Read lazily on every call rather than captured at module
 * load: in `next dev` an edit to `.env.local` refreshes `process.env` but does
 * NOT re-run already-imported module top-level code, so a module-scoped const
 * would stay stale (null) and fail every request closed. Kept server-only (no
 * NEXT_PUBLIC_ prefix) so it never ships to the browser.
 */
function getSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET_KEY
  return raw ? new TextEncoder().encode(raw) : null
}

/**
 * Verify an access token and return its identity claims, or null if the token
 * is missing, malformed, expired, or the signature does not check out. Fails
 * closed: a misconfigured secret yields null (treated as unauthenticated),
 * never an authenticated fallback.
 */
export async function verifyAccessToken(
  token: string | null | undefined,
): Promise<VerifiedIdentity | null> {
  if (!token) return null

  const secret = getSecret()
  if (!secret) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true
      console.error(
        "[auth] JWT_SECRET_KEY is not set — access tokens cannot be verified, " +
          "so all requests are treated as unauthenticated. Set it to the same " +
          "value as the backend's JWT_SECRET_KEY.",
      )
    }
    return null
  }

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })

    const sub = payload.sub
    const role = payload.role
    if (typeof sub !== "string" || typeof role !== "string") return null

    const email = typeof payload.email === "string" ? payload.email : ""
    return { id: sub, email, role: normalizeRole(role) }
  } catch {
    // Invalid signature, expired, malformed — all mean "not authenticated".
    return null
  }
}
