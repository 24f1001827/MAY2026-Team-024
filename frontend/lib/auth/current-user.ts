/**
 * lib/auth/current-user.ts
 *
 * Server-only helpers to resolve the signed-in user from the session cookie and
 * gate dashboard pages by role. Import ONLY from server components / route
 * handlers (uses next/headers). The session is established by the auth route
 * handlers under `app/api/auth/*`; see `lib/auth/session.ts`.
 */

import { redirect } from "next/navigation"

import { verifyAccessToken } from "@/lib/auth/access-token"
import {
  readAccessToken,
  readSessionUser,
  type SessionUser,
} from "@/lib/auth/session"
import { publicRoutes, routes } from "@/nav"
import type { UserRole } from "@/types/user"

export type { SessionUser } from "@/lib/auth/session"

/**
 * Resolve the signed-in user, or null. Identity and role come from the
 * *signature-verified* access token (see `lib/auth/access-token.ts`) — never
 * from the forgeable JSON snapshot — so this result is safe to authorize on.
 * The snapshot only fills in display fields (`name`, `status`) that the token
 * does not carry. If the token is missing/invalid, the user is unauthenticated
 * regardless of what the snapshot cookie says.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await readAccessToken()
  const identity = await verifyAccessToken(token)
  if (!identity) return null

  const snapshot = await readSessionUser()
  return {
    // Authoritative — proven by the signed token.
    id: identity.id,
    email: identity.email || snapshot?.email || "",
    role: identity.role,
    // Display-only — from the snapshot, safe because they are never gated on.
    name: snapshot?.name ?? identity.email ?? "",
    status: snapshot?.status ?? "Active",
  }
}

/** Require any authenticated user; redirect to login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect(publicRoutes.login)
  return user
}

/** Require one of the given roles; redirect to the dashboard home otherwise. */
export async function requireRoles(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect(routes.href)
  return user
}

/**
 * The current user's backend access token, for forwarding as a Bearer header to
 * authenticated backend endpoints from server components / route handlers.
 */
export async function getAccessToken(): Promise<string | null> {
  return readAccessToken()
}
