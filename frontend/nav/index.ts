/**
 * nav/index.ts
 *
 * Main entry point for the navigation platform.
 *
 * Import from here in application code:
 *   import { navigation, routes, DASHBOARD_BASE } from '@/nav';
 *
 * The generated files are the filesystem-derived source of truth.
 * The metadata files contain all human-authored UI intent.
 * The composer merges them into the final typed nav tree.
 */

import { ROUTE_TREE } from "./generated/routes.generated"
import { metadataRegistry } from "./metadata"
import { composeNavigation } from "./compose"
import { createBreadcrumbUtils } from "./breadcrumbs"
import { buildIdIndex, buildPathIndex, flattenComposedNav } from "./indexes"

// ---------------------------------------------------------------------------
// Core composed navigation tree
// ---------------------------------------------------------------------------

/**
 * The primary navigation tree.
 * Produced by composing the filesystem-derived route tree with authored metadata.
 * This is the single source of truth for sidebar items, breadcrumbs, and RBAC.
 */
export const navigation = composeNavigation(
  [{ ...ROUTE_TREE, children: [] }, ...ROUTE_TREE.children],
  metadataRegistry
)

// ---------------------------------------------------------------------------
// Precomputed indexes (module-level singletons — zero runtime overhead)
// ---------------------------------------------------------------------------

export const navById = buildIdIndex(navigation)
export const navByPath = buildPathIndex(navigation)
export const allNavItems = flattenComposedNav(navigation)

// ---------------------------------------------------------------------------
// Breadcrumb utilities (precomputed from the composed tree)
// ---------------------------------------------------------------------------

export const breadcrumbUtils = createBreadcrumbUtils(navigation)

export const {
  labelMap: breadcrumbNameMap,
  hiddenSegments,
  nonInteractiveSegments,
  getBreadcrumbLabel,
  isHiddenSegment,
  isNonInteractiveSegment,
} = breadcrumbUtils

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { DASHBOARD_BASE } from "./types"
export type {
  NavItem,
  ComposedNavItem,
  RouteNode,
  RouteMetadata,
  MetadataRegistry,
} from "./types"

export type { Role, Permission, AccessConfig } from "./access/roles"
export {
  OPEN_ACCESS,
  ADMIN_ONLY,
  STAFF_ONLY,
  TENDER_ACCESS,
  ROLES,
} from "./access/roles"
export {
  canAccess,
  filterNavByAccess,
  isStaff,
  isAdmin,
} from "./access/evaluate"
export type { AccessContext } from "./access/evaluate"

export { routes } from "./generated/route-helpers.generated"
export type { Routes } from "./generated/route-helpers.generated"

export { ROUTE_TREE, ALL_ROUTE_NODES } from "./generated/routes.generated"
export {
  routeById,
  routeByPath,
  allRouteIds,
} from "./generated/route-index.generated"

export { composeNavigation } from "./compose"
export { metadataRegistry } from "./metadata"

export { runValidation, logValidationResult } from "./validators"

// ---------------------------------------------------------------------------
// Sidebar helpers
// ---------------------------------------------------------------------------

/**
 * Return sidebar-visible navigation items (excludes sidebarHidden and dynamic routes).
 */
export function getSidebarItems() {
  return filterSidebarItems(navigation)
}

function filterSidebarItems(items: typeof navigation): typeof navigation {
  return items
    .filter((item) => !item.sidebarHidden && !item.isDynamic)
    .map((item) => ({
      ...item,
      children: item.children ? filterSidebarItems(item.children) : [],
    }))
}

// ---------------------------------------------------------------------------
// Active-path helper
// ---------------------------------------------------------------------------

export function isPathActive(itemUrl: string, currentPath: string): boolean {
  if (currentPath === itemUrl) return true
  return currentPath.startsWith(itemUrl + "/")
}

// ---------------------------------------------------------------------------
// ID-segment detection
// ---------------------------------------------------------------------------

export function isIdSegment(segment: string): boolean {
  return (
    /^\d+$/.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment
    )
  )
}

// ---------------------------------------------------------------------------
// Public routes (non-dashboard, unauthenticated pages)
// ---------------------------------------------------------------------------

export const publicRoutes = {
  home: "/",
  login: "/login",
  register: "/register",
  registerCitizen: "/register/citizen",
  registerOfficer: "/register/officer",
  registerAgency: "/register/agency",
  forgotPassword: "/forgot-password",
  about: "/about",
  support: "/support",
  contact: "/contact",
} as const

export type PublicRoutes = typeof publicRoutes
