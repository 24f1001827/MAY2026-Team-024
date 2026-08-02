/**
 * lib/auth/current-user.ts
 *
 * Server-only helpers to resolve the signed-in user from the session cookie and
 * gate dashboard pages by role. Import ONLY from server components / route
 * handlers (uses next/headers). The session is established by the auth route
 * handlers under `app/api/auth/*`; see `lib/auth/session.ts`.
 */

import { redirect } from "next/navigation"

import {
  readAccessToken,
  readSessionUser,
  type SessionUser,
} from "@/lib/auth/session"
import { publicRoutes, routes } from "@/nav"
import type { UserRole } from "@/types/user"

export type { SessionUser } from "@/lib/auth/session"

/** Resolve the signed-in user from the session cookie, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return readSessionUser()
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
