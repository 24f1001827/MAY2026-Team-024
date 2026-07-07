/**
 * nav/compose/index.ts
 *
 * Navigation composer — merges the filesystem-derived RouteNode tree
 * with human-authored RouteMetadata to produce the final ComposedNavItem tree.
 *
 * This is the single place where structure (routes) meets intent (metadata).
 */

import type {
  RouteNode,
  RouteMetadata,
  MetadataRegistry,
  ComposedNavItem,
} from "../types"
import { OPEN_ACCESS } from "../access/roles"

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Converts a route segment or ID into a readable Title Case fallback label. */
function toTitleCase(str: string): string {
  return str
    .replaceAll(/[-_]/g, " ")
    .replaceAll(/\[|\]/g, "")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase())
}

/** Merges a RouteNode with its metadata into a ComposedNavItem. */
function composeNode(
  node: RouteNode,
  meta: RouteMetadata,
  composedChildren: ComposedNavItem[]
): ComposedNavItem {
  const label = meta.label ?? toTitleCase(node.segment)

  return {
    // Route identity
    id: node.id,
    segment: node.segment,
    path: node.path,
    isDynamic: node.isDynamic,
    isCatchAll: node.isCatchAll,
    paramName: node.paramName,

    // Metadata (with defaults)
    label,
    icon: meta.icon,
    breadcrumb: meta.breadcrumb,
    description: meta.description,
    sidebarHidden: meta.sidebarHidden ?? false,
    breadcrumbHidden: meta.breadcrumbHidden ?? false,
    nonInteractive: meta.nonInteractive ?? false,
    hideWhenLocked: meta.hideWhenLocked ?? false,
    access: meta.access ?? OPEN_ACCESS,

    children: composedChildren,
  }
}

// ---------------------------------------------------------------------------
// Compose tree
// ---------------------------------------------------------------------------

/**
 * Recursively composes a RouteNode subtree into ComposedNavItem[].
 *
 * Children are sorted by:
 *  1. Metadata order (lower first)
 *  2. Static routes before dynamic routes
 *  3. Alphabetical within each group
 */
export function composeTree(
  nodes: RouteNode[],
  registry: MetadataRegistry
): ComposedNavItem[] {
  const composed = nodes.map((node) => {
    const meta = registry[node.id] ?? {}
    const composedChildren = composeTree(node.children, registry)
    return composeNode(node, meta, composedChildren)
  })

  return composed.toSorted((a, b) => {
    const orderA = registry[a.id]?.order ?? 999
    const orderB = registry[b.id]?.order ?? 999
    if (orderA !== orderB) return orderA - orderB
    if (a.isDynamic !== b.isDynamic) return a.isDynamic ? 1 : -1
    return a.segment.localeCompare(b.segment)
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ComposeOptions {
  /**
   * When true, dynamic routes ([id] segments) are excluded from the composed
   * tree. Useful for building the sidebar, which never shows param routes.
   * Default: false.
   */
  excludeDynamic?: boolean
}

/**
 * Composes the full navigation tree from the route tree root + metadata registry.
 *
 * @example
 * const nav = composeNavigation(ROUTE_TREE.children, metadataRegistry);
 */
export function composeNavigation(
  routeNodes: RouteNode[],
  registry: MetadataRegistry,
  options: ComposeOptions = {}
): ComposedNavItem[] {
  let nodes = routeNodes
  if (options.excludeDynamic) {
    nodes = nodes.filter((n) => !n.isDynamic)
  }
  return composeTree(nodes, registry)
}
