/**
 * nav/breadcrumbs/index.ts
 *
 * Breadcrumb-specific utilities built on top of the composed navigation.
 */

import type { ComposedNavItem } from "../types"
import {
  buildBreadcrumbLabelIndex,
  buildNonInteractiveSet,
  flattenComposedNav,
} from "../indexes"

// ---------------------------------------------------------------------------
// Base hidden segments — never shown in breadcrumbs
// ---------------------------------------------------------------------------

export const BASE_HIDDEN_SEGMENTS: ReadonlySet<string> = new Set(["dashboard"])

// ---------------------------------------------------------------------------
// Derived utilities (require a composed nav tree)
// ---------------------------------------------------------------------------

/**
 * Create a breadcrumb utilities bundle from a composed nav tree.
 * Call once and memoize the result.
 */
export function createBreadcrumbUtils(nav: ComposedNavItem[]) {
  const labelMap = buildBreadcrumbLabelIndex(nav, {
    new: "New",
    edit: "Edit",
    complaints: "Complaints",
    tenders: "Tenders",
    departments: "Departments",
    officers: "Officers",
    agencies: "Agencies",
    notifications: "Notifications",
    settings: "Settings",
  })

  const nonInteractiveSegments = buildNonInteractiveSet(nav)

  const hiddenSegments: ReadonlySet<string> = new Set([
    ...BASE_HIDDEN_SEGMENTS,
    ...flattenComposedNav(nav)
      .filter((item) => item.breadcrumbHidden)
      .map((item) => item.segment),
  ])

  function getBreadcrumbLabel(segment: string): string {
    return (
      labelMap[segment] ??
      segment.charAt(0).toUpperCase() + segment.slice(1).replaceAll("-", " ")
    )
  }

  function isHiddenSegment(segment: string): boolean {
    return hiddenSegments.has(segment)
  }

  function isNonInteractiveSegment(segment: string): boolean {
    return nonInteractiveSegments.has(segment)
  }

  return {
    labelMap,
    hiddenSegments,
    nonInteractiveSegments,
    getBreadcrumbLabel,
    isHiddenSegment,
    isNonInteractiveSegment,
  }
}

export type BreadcrumbUtils = ReturnType<typeof createBreadcrumbUtils>
