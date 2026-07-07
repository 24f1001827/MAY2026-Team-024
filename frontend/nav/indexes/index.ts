/**
 * nav/indexes/index.ts
 *
 * Runtime index builders over the composed navigation tree.
 * These provide O(1) lookups for labels, icons, access config, etc.
 * Built once at module initialization time and memoized.
 */

import type { ComposedNavItem } from "../types"

// ---------------------------------------------------------------------------
// Tree flattener
// ---------------------------------------------------------------------------

export function flattenComposedNav(
  items: ComposedNavItem[]
): ComposedNavItem[] {
  const result: ComposedNavItem[] = []
  for (const item of items) {
    result.push(item)
    if (item.children.length > 0)
      result.push(...flattenComposedNav(item.children))
  }
  return result
}

// ---------------------------------------------------------------------------
// Index builders
// ---------------------------------------------------------------------------

/** Build an O(1) map from route ID to ComposedNavItem. */
export function buildIdIndex(
  items: ComposedNavItem[]
): Readonly<Record<string, ComposedNavItem>> {
  return Object.fromEntries(
    flattenComposedNav(items).map((item) => [item.id, item])
  )
}

/** Build an O(1) map from path to ComposedNavItem. */
export function buildPathIndex(
  items: ComposedNavItem[]
): Readonly<Record<string, ComposedNavItem>> {
  return Object.fromEntries(
    flattenComposedNav(items).map((item) => [item.path, item])
  )
}

/**
 * Build an O(1) map from segment → breadcrumb label.
 * When multiple items share a segment (e.g. 'settings', 'new'),
 * the first match wins — top-level items have priority.
 */
export function buildBreadcrumbLabelIndex(
  items: ComposedNavItem[],
  extraLabels: Record<string, string> = {}
): Readonly<Record<string, string>> {
  const map: Record<string, string> = { ...extraLabels }

  // Top-level items first (priority)
  for (const item of items) {
    if (!map[item.segment]) {
      map[item.segment] = item.breadcrumb ?? item.label
    }
  }

  // Then all nested items
  for (const item of flattenComposedNav(items)) {
    if (!map[item.segment]) {
      map[item.segment] = item.breadcrumb ?? item.label
    }
  }

  return map
}

/**
 * Build a parent-child map keyed by parent ID.
 * Useful for programmatic traversal without walking the tree.
 */
export function buildParentIndex(
  items: ComposedNavItem[]
): Readonly<Record<string, ComposedNavItem[]>> {
  const map: Record<string, ComposedNavItem[]> = {}

  function walk(nodes: ComposedNavItem[]): void {
    for (const node of nodes) {
      map[node.id] = node.children
      if (node.children.length > 0) walk(node.children)
    }
  }

  walk(items)
  return map
}

/**
 * Build a set of IDs that are non-interactive (section headers).
 * Fast O(1) lookup for breadcrumb rendering.
 */
export function buildNonInteractiveSet(
  items: ComposedNavItem[]
): Readonly<Set<string>> {
  return new Set(
    flattenComposedNav(items)
      .filter((item) => item.nonInteractive)
      .map((item) => item.segment)
  )
}

/**
 * Build a set of segments that should be hidden from breadcrumbs.
 */
export function buildHiddenSegmentSet(
  baseSegments: Iterable<string>,
  items: ComposedNavItem[]
): Readonly<Set<string>> {
  const set = new Set<string>(baseSegments)
  for (const item of flattenComposedNav(items)) {
    if (item.breadcrumbHidden) set.add(item.segment)
  }
  return set
}
