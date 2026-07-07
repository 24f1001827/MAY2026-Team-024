/**
 * nav/access/evaluate.ts
 *
 * Access evaluation helpers. Used by the sidebar, permission gates,
 * and any code that needs to check whether a user can see or use a route.
 */

import type { AccessConfig, Role, Permission } from "./roles"
import type { ComposedNavItem } from "../types"

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface AccessContext {
  /** The user's role. */
  role?: Role
  /** Fine-grained permissions granted to the user. */
  permissions?: Permission[]
  /** Whether the user is authenticated at all. */
  isAuthenticated: boolean
}

// ---------------------------------------------------------------------------
// Core evaluator
// ---------------------------------------------------------------------------

/**
 * Returns true when the given AccessConfig allows access for the provided context.
 *
 * Evaluation order:
 *  1. requireAuth check
 *  2. denyRoles check (deny wins over allow)
 *  3. allowRoles check (empty = all roles pass)
 *  4. permissions check (all must pass)
 */
export function canAccess(config: AccessConfig, ctx: AccessContext): boolean {
  if (config.requireAuth && !ctx.isAuthenticated) return false

  if (
    config.denyRoles?.length &&
    ctx.role &&
    config.denyRoles.includes(ctx.role)
  ) {
    return false
  }

  if (
    config.allowRoles?.length &&
    (!ctx.role || !config.allowRoles.includes(ctx.role))
  )
    return false

  if (config.permissions?.length) {
    const userPerms = ctx.permissions ?? []
    const hasAll = config.permissions.every((p) => userPerms.includes(p))
    if (!hasAll) return false
  }

  return true
}

// ---------------------------------------------------------------------------
// Nav-tree filter
// ---------------------------------------------------------------------------

/**
 * Recursively filter a nav tree to only include items accessible in the
 * given context. Preserves tree shape; removes inaccessible subtrees.
 */
export function filterNavByAccess(
  items: ComposedNavItem[],
  ctx: AccessContext
): ComposedNavItem[] {
  return items
    .filter((item) => canAccess(item.access, ctx))
    .map((item) => ({
      ...item,
      children: filterNavByAccess(item.children, ctx),
    }))
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

/** Returns true when the role is internal staff (officer or admin). */
export function isStaff(role?: Role): boolean {
  return role === "admin" || role === "officer"
}

/** Returns true when the role is admin. */
export function isAdmin(role?: Role): boolean {
  return role === "admin"
}
