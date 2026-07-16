/**
 * lib/auth/current-user.ts
 *
 * Server-only helpers to resolve the mock-session user and gate dashboard
 * pages by role. Import ONLY from server components / route handlers (uses
 * next/headers). Replace with the real auth layer alongside `mock-session`.
 */

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { mockUsers } from "@/components/shared/mock-data"
import { MOCK_SESSION_COOKIE } from "@/lib/auth/mock-session"
import { publicRoutes, routes } from "@/nav"
import type { User, UserRole } from "@/types/user"

/** Resolve the signed-in user from the session cookie, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies()
  const id = store.get(MOCK_SESSION_COOKIE)?.value
  return mockUsers.find((u) => u.id === id) ?? null
}

/** Require any authenticated user; redirect to login otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect(publicRoutes.login)
  return user
}

/** Require one of the given roles; redirect to the dashboard home otherwise. */
export async function requireRoles(roles: UserRole[]): Promise<User> {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect(routes.href)
  return user
}
