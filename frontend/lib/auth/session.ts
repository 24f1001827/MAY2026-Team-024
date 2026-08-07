/**
 * lib/auth/session.ts
 *
 * Server-only session storage backed by httpOnly cookies. The frontend keeps
 * the Flask-issued JWTs (never exposed to client JS) plus a small snapshot of
 * the user for display and server-side role gating.
 *
 * - write/clear: called from route handlers (`app/api/auth/*`) only.
 * - read: safe from server components and route handlers.
 */

import { cookies } from "next/headers"

import type { SessionUser } from "@/types/auth"
import type { BackendSession } from "@/lib/auth/api"
import { normalizeRole, normalizeStatus } from "@/lib/utils/user/normalize"

export type { SessionUser } from "@/types/auth"

/** httpOnly cookie holding the access token (forwarded as Bearer on data calls). */
export const ACCESS_COOKIE = "rastro_access"
/** httpOnly cookie holding the refresh token (reserved for a future /auth/refresh). */
export const REFRESH_COOKIE = "rastro_refresh"
/** httpOnly cookie holding the JSON user snapshot used for gating + display. */
export const USER_COOKIE = "rastro_user"

const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
}

/** Persist a freshly-issued backend session. Route handlers only. */
export async function setSessionCookies(session: BackendSession): Promise<void> {
  const store = await cookies()
  // Normalize casing the same way the admin user rows are (accepts either the
  // enum NAME "OFFICER"/"PENDING_APPROVAL" or the value "Officer"/"Active"), so
  // role gating (`requireRoles`, `user.role === "Officer"`) never breaks on
  // backend serialization drift.
  const user: SessionUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: normalizeRole(session.user.role),
    status: normalizeStatus(session.user.status),
    isDepartmentHead: Boolean(session.user.is_department_head),
  }

  store.set(ACCESS_COOKIE, session.access_token, baseCookieOptions)
  store.set(REFRESH_COOKIE, session.refresh_token, baseCookieOptions)
  store.set(USER_COOKIE, JSON.stringify(user), baseCookieOptions)
}

/** Clear the session (sign out). Route handlers only. */
export async function clearSessionCookies(): Promise<void> {
  const store = await cookies()
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE]) {
    store.delete({ name, path: "/" })
  }
}

/** Resolve the signed-in user from the cookie, or null. */
export async function readSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const raw = store.get(USER_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

/** The access token for forwarding to authed backend endpoints, or null. */
export async function readAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_COOKIE)?.value ?? null
}
